import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { type Server, WebSocket } from 'ws';

@WebSocketGateway({
  cors: true,
  path: '/ws/deployments',
})
export class DeploymentGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private clientSubscriptions: Map<
    WebSocket,
    { deployments: Set<number>; projects: Set<number> }
  >;
  private deploymentSubscriptions: Map<number, Set<WebSocket>>;
  private projectSubscriptions: Map<number, Set<WebSocket>>;

  private readonly logger = new Logger(DeploymentGateway.name);

  constructor() {
    this.deploymentSubscriptions = new Map();
    this.clientSubscriptions = new Map();
    this.projectSubscriptions = new Map();
  }
  @WebSocketServer()
  server: Server;

  handleConnection(client: WebSocket) {
    // this.logger.log('Incoming websocket connection');
    // const set =
    //   this.deploymentSubscriptions.get(deploymentId) ?? new Set<WebSocket>();
    // set.add(client);
    // this.deploymentSubscriptions.set(deploymentId, set);
    // this.logger.log(`New Client added for deployement : ${deploymentId}`);
    this.logger.log('Incoming websocket connection');
    client.on('message', (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === 'subscribe') {
        let subs = this.clientSubscriptions.get(client);

        if (!subs) {
          subs = { deployments: new Set(), projects: new Set() };
          this.clientSubscriptions.set(client, subs);
        }

        if (message.deploymentId !== undefined) {
          const deploymentId = Number(message.deploymentId);
          if (!Number.isFinite(deploymentId)) {
            this.logger.warn(
              `Received invalid deploymentId in subscribe message: ${message.deploymentId}`,
            );
            return;
          }

          const set =
            this.deploymentSubscriptions.get(deploymentId) ??
            new Set<WebSocket>();

          set.add(client);
          this.deploymentSubscriptions.set(deploymentId, set);

          subs.deployments.add(deploymentId);

          this.logger.log(`Client subscribed to deployment ${deploymentId}`);
        } else if (message.projectId !== undefined) {
          const projectId = Number(message.projectId);
          if (!Number.isFinite(projectId)) {
            this.logger.warn(
              `Received invalid projectId in subscribe message: ${message.projectId}`,
            );
            return;
          }

          const set =
            this.projectSubscriptions.get(projectId) ?? new Set<WebSocket>();

          set.add(client);

          this.projectSubscriptions.set(projectId, set);

          subs.projects.add(projectId);

          this.logger.log(`Client subscribed to project ${projectId}`);
        }
      }
    });
  }

  handleDisconnect(client: WebSocket) {
    this.logger.log(`Client disconnected`);

    const subs = this.clientSubscriptions.get(client);

    if (!subs) return;

    // cleanup deployment subscriptions
    subs.deployments.forEach((deploymentId) => {
      const set = this.deploymentSubscriptions.get(deploymentId);
      if (!set) return;

      set.delete(client);

      if (set.size === 0) {
        this.deploymentSubscriptions.delete(deploymentId);
      }
    });

    subs.projects.forEach((projectId) => {
      const set = this.projectSubscriptions.get(projectId);
      if (!set) return;

      set.delete(client);

      if (set.size === 0) {
        this.projectSubscriptions.delete(projectId);
      }
    });

    this.clientSubscriptions.delete(client);
    this.logger.log('Client subscriptions cleaned');
  }

  sendDeploymentUpdate(deploymentId: number, data: any) {
    const clients = this.deploymentSubscriptions.get(deploymentId);

    if (!clients) return;

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            event: 'deployment-update',
            deploymentId,
            data,
          }),
        );
      }
    });
  }

  sendProjectUpdate(projectId: number, data: any) {
    const clients = this.projectSubscriptions.get(projectId);

    if (!clients) return;

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            event: 'project-update',
            projectId,
            data,
          }),
        );
      }
    });
  }
}
