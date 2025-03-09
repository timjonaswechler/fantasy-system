import { Component } from "@/engine/ecs";

// Position/location
export class PositionComponent extends Component {
  constructor(public x: number, public y: number) {
    super();
  }
}
