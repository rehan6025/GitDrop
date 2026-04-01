import { Injectable } from '@nestjs/common';
import { IBuildStrategy } from '../interfaces/build-strategy.interface.js';
import { ReactBuildStrategy } from './react-build.strategy.js';
import { StaticBuildStrategy } from './static-build.strategy.js';

@Injectable()
export class BuildStrategyFactory {
  getStrategy(type: string): IBuildStrategy {
    switch (type) {
      case 'REACT':
        return new ReactBuildStrategy();
      case 'STATIC':
        return new StaticBuildStrategy();

      default:
        throw new Error(`Unsupported build type: ${type}`);
    }
  }
}
