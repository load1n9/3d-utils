export class GCodeEncoder {
  x = 0;
  y = 0;
  z = 0;
  e = 0;
  last_speed = -1.0;
  lines: number[] = [];
  extrusion_lines: number[] = [];
  filament_diameter = 2.85;
  extrusion_in_mm3 = false;
  travel_speed = 150;
  print_speed = 50;
  output: string[] = [];
  extrusion_per_mm_movement!: number;
  extrusion_per_mm_z_movement!: number;

  #saved_points: Map<string, Position> = new Map();

  /**
   * Start the GCode encoder
   * @param flavor The flavor of the GCode to generate
   */
  start(flavor: "UM2" | "UM3" | "RepRap" = "UM2") {
    switch (flavor) {
      case "UM2":
        this.output = [
          ";FLAVOR:UltiGCode",
          ";TIME:1",
          ";MATERIAL:1",
        ];
        this.extrusion_in_mm3 = true;
        break;
      case "UM3":
        this.output = [
          ";START_OF_HEADER",
          ";HEADER_VERSION:0.1",
          ";FLAVOR:Griffin",
          ";GENERATOR.NAME:GCodeGenJS",
          ";GENERATOR.VERSION:?",
          ";GENERATOR.BUILD_DATE:2016-11-26",
          ";TARGET_MACHINE.NAME:Ultimaker Jedi",
          ";EXTRUDER_TRAIN.0.INITIAL_TEMPERATURE:200",
          ";EXTRUDER_TRAIN.0.MATERIAL.VOLUME_USED:1",
          ";EXTRUDER_TRAIN.0.NOZZLE.DIAMETER:0.4",
          ";BUILD_PLATE.INITIAL_TEMPERATURE:0",
          ";PRINT.TIME:1",
          ";PRINT.SIZE.MIN.X:0",
          ";PRINT.SIZE.MIN.Y:0",
          ";PRINT.SIZE.MIN.Z:0",
          ";PRINT.SIZE.MAX.X:215",
          ";PRINT.SIZE.MAX.Y:215",
          ";PRINT.SIZE.MAX.Z:200",
          ";END_OF_HEADER",
          "G92 E0",
        ];
        break;
      default:
        this.output = [
          ";RepRap target",
          "G28",
          "G92 E0",
        ];
        break;
    }
    this.setExtrusionWidthHeight(0.4, 0.1);
  }

  /**
   * Move the printer head to a new position
   * @param position  The new position to move to
   * @param extrude  Whether to extrude while moving
   */
  move(
    position: {
      x?: number;
      y?: number;
      z?: number;
      absolute?: boolean;
      speed?: number;
    },
    extrude = false,
  ) {
    let new_x = this.x;
    let new_y = this.y;
    let new_z = this.z;
    if (position.absolute) {
      if (position.x != undefined) {
        new_x = position.x;
      }
      if (position.y != undefined) {
        new_y = position.y;
      }
      if (position.z != undefined) {
        new_z = position.z;
      }
    } else {
      if (position.x != undefined) {
        new_x = this.x + position.x;
      }
      if (position.y != undefined) {
        new_y = this.y + position.y;
      }
      if (position.z != undefined) {
        new_z = this.z + position.z;
      }
    }
    const speed = position.speed
      ? position.speed
      : extrude
      ? this.print_speed
      : this.travel_speed;
    this.#move(new_x, new_y, new_z, speed, extrude);
  }

  /**
   * Set the extrusion width and height
   */
  setExtrusionWidthHeight(width: number, height: number) {
    this.extrusion_per_mm_movement = width * height;
    this.extrusion_per_mm_z_movement = Math.PI * (width / 2) * (width / 2);
    if (!this.extrusion_in_mm3) {
      const radius = this.filament_diameter / 2.0;
      this.extrusion_per_mm_movement /= Math.PI * radius * radius;
      this.extrusion_per_mm_z_movement /= Math.PI * radius * radius;
    }
  }

  /**
   * Set the travel speed
   * @param speed The speed to set
   */
  setTravelSpeed(speed: number) {
    this.travel_speed = speed;
  }

  /**
   * Set the print speed
   * @param speed The speed to set
   */
  setPrintSpeed(speed: number) {
    this.print_speed = speed;
  }

  /**
   * Set the fan speed
   * @param speed The speed to set
   */
  fan(speed: number) {
    this.output.push("M106 S" + (speed / 100 * 255));
  }

  /**
   * Set the bed temperature
   * @param temperature The temperature to set
   */
  setHotendTemperature(temperature: number) {
    this.output.push("M109 S" + temperature.toFixed());
  }

  /**
   * Set the bed temperature
   * @param time The time to wait
   */
  wait(time: number) {
    this.output.push("G4 P" + (time * 1000));
  }

  /**
   * Set the bed temperature
   * @param comment value to comment
   */
  comment(comment: string) {
    this.output.push("; " + comment);
  }

  #move(x: number, y: number, z: number, speed: number, extrude = false) {
    if (extrude) {
      const dx = x - this.x;
      const dy = y - this.y;
      const len = Math.sqrt(dx * dx + dy * dy);

      const nx = dy / len * 0.2;
      const ny = -dx / len * 0.2;

      this.extrusion_lines.push(this.x + nx);
      this.extrusion_lines.push(this.y + ny);
      this.extrusion_lines.push(this.z);
      this.extrusion_lines.push(0.0);

      this.extrusion_lines.push(x + nx);
      this.extrusion_lines.push(y + ny);
      this.extrusion_lines.push(z);
      this.extrusion_lines.push(0.0);

      this.extrusion_lines.push(this.x - nx);
      this.extrusion_lines.push(this.y - ny);
      this.extrusion_lines.push(this.z);
      this.extrusion_lines.push(1.0);

      this.extrusion_lines.push(x + nx);
      this.extrusion_lines.push(y + ny);
      this.extrusion_lines.push(z);
      this.extrusion_lines.push(0.0);

      this.extrusion_lines.push(this.x - nx);
      this.extrusion_lines.push(this.y - ny);
      this.extrusion_lines.push(this.z);
      this.extrusion_lines.push(1.0);

      this.extrusion_lines.push(x - nx);
      this.extrusion_lines.push(y - ny);
      this.extrusion_lines.push(z);
      this.extrusion_lines.push(1.0);
    } else {
      this.lines.push(this.x);
      this.lines.push(this.y);
      this.lines.push(this.z);
      this.lines.push(x);
      this.lines.push(y);
      this.lines.push(z);
    }

    let command = "G0";
    if (extrude) {
      command = "G1";

      const distance_xy = Math.sqrt(
        (x - this.x) * (x - this.x) + (y - this.y) * (y - this.y),
      );
      const distance_z = z - this.z;
      this.e += distance_xy * this.extrusion_per_mm_movement;
      this.e += distance_z * this.extrusion_per_mm_z_movement;
    }
    if (speed != this.last_speed) {
      command += " F" + (speed * 60);
      this.last_speed = speed;
    }
    if (x != this.x) {
      command += " X" + x.toFixed(3);
      this.x = x;
    }
    if (y != this.y) {
      command += " Y" + y.toFixed(3);
      this.y = y;
    }
    if (z != this.z) {
      command += " Z" + z.toFixed(3);
      this.z = z;
    }
    if (extrude) {
      command += " E" + this.e.toFixed(5);
    }
    if (command.length > 2) {
      this.output.push(command);
    }
  }

  /**
   * Save the current position
   * @param name The name of the position
   */
  savePosition(name: string) {
    this.#saved_points.set(
      name,
      new Position({
        x: this.x!,
        y: this.y!,
        z: this.z!,
        speed: this.print_speed,
      }),
    );
  }

  /**
   * Move to a saved position
   * @param name The name of the position
   * @param extrude Whether to extrude while moving
   */
  moveToSavedPosition(name: string, extrude = false) {
    const position = this.#saved_points.get(name);
    if (position) {
      this.move({
        x: position.x,
        y: position.y,
        z: position.z,
        absolute: true,
        speed: position.speed,
      }, extrude);
      return;
    }
    console.error(`saved position \`${name}\` not found`);
  }
  /**
   * End the GCode encoder
   * @returns The output of the encoder
   */
  getOutput(): string[] {
    return this.output;
  }

  /**
   * @returns The output of the encoder as a string
   */
  toString(): string {
    return this.output.join("\n");
  }

  /**
   * Write the output to a file
   * @param path The path to write the file to
   */
  writeToFile(path: string) {
    Deno.writeTextFileSync(path, this.toString());
  }
}

export class Position {
  x: number;
  y: number;
  z: number;
  absolute: boolean;
  speed?: number;
  constructor(
    data: {
      x: number;
      y: number;
      z: number;
      absolute?: boolean;
      speed: number;
    },
  ) {
    this.x = data["x"];
    this.y = data["y"];
    this.z = data["z"];
    this.absolute = data["absolute"] || false;
    this.speed = data["speed"];
  }

  /**
   * Add another position to this position
   * @param other The other position to add
   */
  add(other: Position): Position {
    this.x = this.#sum(this.x, other.x)!;
    this.y = this.#sum(this.y, other.y)!;
    this.z = this.#sum(this.z, other.z)!;
    this.absolute = this.absolute || other.absolute;
    this.speed = this.speed || other.speed;
    return this;
  }

  #sum(a?: number, b?: number) {
    if (a == undefined && b == undefined) {
      return undefined;
    }

    return (a || 0.0) + (b || 0.0);
  }
}
