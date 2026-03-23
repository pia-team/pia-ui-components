import { describe, it, expect } from "vitest";
import {
  serializeCompound,
  deserializeCompound,
  flattenToConditions,
  createGroup,
  groupFromFlat,
  addToGroup,
  removeFromGroup,
  toggleGroupLogic,
  countConditions,
  isFilterGroup,
} from "../src/index.js";
import type { FilterCondition, FilterGroup } from "../src/index.js";

const cond1: FilterCondition = { field: "name", operator: "eq", value: "Alice" };
const cond2: FilterCondition = { field: "age", operator: "gte", value: "18" };
const cond3: FilterCondition = { field: "status", operator: "in", value: ["active", "pending"] };

describe("isFilterGroup", () => {
  it("returns true for groups", () => {
    expect(isFilterGroup({ logic: "and", conditions: [] })).toBe(true);
  });

  it("returns false for conditions", () => {
    expect(isFilterGroup(cond1)).toBe(false);
  });
});

describe("createGroup", () => {
  it("creates an AND group by default", () => {
    const g = createGroup();
    expect(g.logic).toBe("and");
    expect(g.conditions).toEqual([]);
  });

  it("creates an OR group", () => {
    const g = createGroup("or");
    expect(g.logic).toBe("or");
  });
});

describe("groupFromFlat", () => {
  it("wraps conditions in a group", () => {
    const g = groupFromFlat([cond1, cond2]);
    expect(g.logic).toBe("and");
    expect(g.conditions).toHaveLength(2);
  });
});

describe("addToGroup / removeFromGroup", () => {
  it("adds a condition immutably", () => {
    const g = createGroup();
    const g2 = addToGroup(g, cond1);
    expect(g.conditions).toHaveLength(0);
    expect(g2.conditions).toHaveLength(1);
  });

  it("removes by index immutably", () => {
    const g = groupFromFlat([cond1, cond2, cond3]);
    const g2 = removeFromGroup(g, 1);
    expect(g.conditions).toHaveLength(3);
    expect(g2.conditions).toHaveLength(2);
    expect(g2.conditions[0]).toEqual(cond1);
    expect(g2.conditions[1]).toEqual(cond3);
  });
});

describe("toggleGroupLogic", () => {
  it("flips AND to OR", () => {
    const g = createGroup("and");
    expect(toggleGroupLogic(g).logic).toBe("or");
  });

  it("flips OR to AND", () => {
    const g = createGroup("or");
    expect(toggleGroupLogic(g).logic).toBe("and");
  });
});

describe("countConditions", () => {
  it("counts a single condition as 1", () => {
    expect(countConditions(cond1)).toBe(1);
  });

  it("counts nested groups correctly", () => {
    const nested: FilterGroup = {
      logic: "and",
      conditions: [
        cond1,
        { logic: "or", conditions: [cond2, cond3] },
      ],
    };
    expect(countConditions(nested)).toBe(3);
  });
});

describe("flattenToConditions", () => {
  it("flattens a nested tree to leaf conditions", () => {
    const tree: FilterGroup = {
      logic: "and",
      conditions: [
        cond1,
        { logic: "or", conditions: [cond2, cond3] },
      ],
    };
    const flat = flattenToConditions(tree);
    expect(flat).toHaveLength(3);
    expect(flat[0]).toEqual(cond1);
    expect(flat[1]).toEqual(cond2);
    expect(flat[2]).toEqual(cond3);
  });
});

describe("serializeCompound / deserializeCompound round-trip", () => {
  it("serializes and deserializes a nested tree", () => {
    const tree: FilterGroup = {
      logic: "and",
      conditions: [
        cond1,
        {
          logic: "or",
          conditions: [cond2, cond3],
        },
      ],
    };

    const json = serializeCompound(tree);
    expect(json.logic).toBe("and");
    expect(json.conditions).toHaveLength(2);

    const restored = deserializeCompound(json);
    expect(restored.logic).toBe("and");
    expect(restored.conditions).toHaveLength(2);
    expect(isFilterGroup(restored.conditions[1])).toBe(true);

    const inner = restored.conditions[1] as FilterGroup;
    expect(inner.logic).toBe("or");
    expect(inner.conditions).toHaveLength(2);
  });
});
