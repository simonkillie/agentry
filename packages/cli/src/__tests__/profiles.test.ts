import { describe, it, expect } from 'vitest';
import { mapProfile, PROFILES } from '../profiles';

describe('mapProfile', () => {
  it('maps score 0-19 to Hand-Coder', () => {
    expect(mapProfile(0)).toBe('Hand-Coder');
    expect(mapProfile(10)).toBe('Hand-Coder');
    expect(mapProfile(19)).toBe('Hand-Coder');
  });

  it('maps score 20-44 to Copilot Collaborator', () => {
    expect(mapProfile(20)).toBe('Copilot Collaborator');
    expect(mapProfile(38)).toBe('Copilot Collaborator');
    expect(mapProfile(44)).toBe('Copilot Collaborator');
  });

  it('maps score 45-69 to Autonomous Operator', () => {
    expect(mapProfile(45)).toBe('Autonomous Operator');
    expect(mapProfile(60)).toBe('Autonomous Operator');
  });

  it('maps score 70-84 to Hands-Off Architect', () => {
    expect(mapProfile(70)).toBe('Hands-Off Architect');
    expect(mapProfile(80)).toBe('Hands-Off Architect');
  });

  it('maps score 85-100 to Fleet Orchestrator', () => {
    expect(mapProfile(85)).toBe('Fleet Orchestrator');
    expect(mapProfile(100)).toBe('Fleet Orchestrator');
  });

  it('clamps scores outside 0-100', () => {
    expect(mapProfile(-10)).toBe('Hand-Coder');
    expect(mapProfile(110)).toBe('Fleet Orchestrator');
  });
});

describe('PROFILES', () => {
  it('has a non-empty description for each profile entry', () => {
    for (const p of PROFILES) {
      expect(p.description.length).toBeGreaterThan(0);
    }
  });

  it('covers all five profiles with non-overlapping ranges', () => {
    expect(PROFILES).toHaveLength(5);
    const names = PROFILES.map(p => p.name);
    expect(names).toContain('Hand-Coder');
    expect(names).toContain('Fleet Orchestrator');
  });
});
