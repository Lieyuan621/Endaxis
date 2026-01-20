import { describe, it, expect } from "vitest";
import { simulate } from "./simulator";
import { simulatorFixture1 } from "./fixture/simulator.fixture";
import { projectSpSeries } from "./projection/projectSpSeries";
import { projectStaggerSeries } from "./projection/projectStaggerSeries";
import { compileScenario } from "./compiler/compileScenario";
import { formatSimLogEntry } from "./formatSimLogEntry";

describe("SimulationEngine Integration", () => {
  it("should match SP snapshot", () => {
    const { timeline, teamConfig, enemyConfig, actors } = compileScenario(
      simulatorFixture1.scenario,
    );

    const result = simulate(timeline, teamConfig, enemyConfig, actors);

    result.simLog.forEach((entry) => {
      console.log(formatSimLogEntry(entry));
    });

    const projection = projectSpSeries(
      result.simLog,
      result.state.getInitialSnapshot(),
    );

    expect(projection).toMatchSnapshot();
  });

  it("should match Stagger snapshot", () => {
    const { timeline, teamConfig, enemyConfig, actors } = compileScenario(
      simulatorFixture1.scenario,
      {
        systemConstants: {
          maxStagger: 125,
          staggerNodeDuration: 2,
          staggerNodeCount: 0,
        },
      },
    );

    const result = simulate(timeline, teamConfig, enemyConfig, actors);

    const projection = projectStaggerSeries(
      result.simLog,
      result.state.getInitialSnapshot(),
      enemyConfig,
    );

    expect(projection.nodeStep).toBe(125);

    expect(projection).toMatchSnapshot();
  });
});
