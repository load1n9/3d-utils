import { GCodeEncoder } from "../encoder.ts";

const encoder = new GCodeEncoder();
encoder.start();

encoder.comment("This program will draw a 1 cm cube and export the gcode");

encoder.comment("Move to starting position");
encoder.move({ x: 10, y: 10, z: 0, absolute: true });

encoder.comment("Draw the base of the cube");

encoder.move({ x: 20, y: 10, z: 0, absolute: true }, true);
encoder.move({ x: 20, y: 20, z: 0, absolute: true }, true);
encoder.move({ x: 10, y: 20, z: 0, absolute: true }, true);
encoder.move({ x: 10, y: 10, z: 0, absolute: true }, true);

encoder.comment("Draw the top of the cube");

encoder.move({ x: 20, y: 10, z: 10, absolute: true }, true);
encoder.move({ x: 20, y: 20, z: 10, absolute: true }, true);
encoder.move({ x: 10, y: 20, z: 10, absolute: true }, true);
encoder.move({ x: 10, y: 10, z: 10, absolute: true }, true);

encoder.comment("Draw the edges of the cube");

encoder.move({ x: 20, y: 10, z: 0, absolute: true }, true);
encoder.move({ x: 20, y: 10, z: 10, absolute: true }, true);
encoder.move({ x: 20, y: 20, z: 10, absolute: true }, true);
encoder.move({ x: 20, y: 20, z: 0, absolute: true }, true);
encoder.move({ x: 10, y: 20, z: 0, absolute: true }, true);
encoder.move({ x: 10, y: 20, z: 10, absolute: true }, true);
encoder.move({ x: 10, y: 10, z: 10, absolute: true }, true);
encoder.move({ x: 10, y: 10, z: 0, absolute: true }, true);


encoder.writeToFile("cube.gcode");
