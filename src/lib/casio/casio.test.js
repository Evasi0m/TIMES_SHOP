import { describe, it, expect } from 'vitest';
import { getCasioModelBase, getCasioModelFull, parseCasioModel } from './parse-model.js';
import { getSeries } from './series-rules.js';
import { getSubTypeForModel } from './sub-type-rules.js';
import { enrichCasioFromModelCode } from './enrich.js';
import { getProductDisplayLines } from './model-display.js';

describe('getCasioModelBase', () => {
  it('strips color suffix', () => {
    expect(getCasioModelBase('W-219HC-3B')).toBe('W-219HC');
    expect(getCasioModelBase('GA-2100-1A')).toBe('GA-2100');
    expect(getCasioModelBase('MTP-1302D-7A2')).toBe('MTP-1302D');
    expect(getCasioModelBase('A168WA-1')).toBe('A168WA');
  });

  it('returns full when no variant suffix', () => {
    expect(getCasioModelBase('ABC')).toBe('ABC');
  });
});

describe('getCasioModelFull', () => {
  it('normalizes to uppercase', () => {
    expect(getCasioModelFull('w-219hc-3b')).toBe('W-219HC-3B');
  });
});

describe('getSeries', () => {
  it('classifies series per doc §30', () => {
    expect(getSeries('GA-2100-1A')).toBe('gshock');
    expect(getSeries('DW-5600BB-1')).toBe('gshock');
    expect(getSeries('BGA-290-7A')).toBe('babyg');
    expect(getSeries('EFR-539D-1A2')).toBe('edifice');
    expect(getSeries('PRW-30-1A')).toBe('protrek');
    expect(getSeries('MTP-1302D-7A2')).toBe('standard');
  });
});

describe('getSubTypeForModel', () => {
  it('classifies sub-types per doc §30', () => {
    expect(getSubTypeForModel('GA-2100-1A', 'gshock')).toBe('gs-anadigi');
    expect(getSubTypeForModel('DW-5600BB-1', 'gshock')).toBe('gs-digital');
    expect(getSubTypeForModel('GST-B400-1A', 'gshock')).toBe('gs-metal');
    expect(getSubTypeForModel('MTP-1302D-7A2', 'standard')).toBe('st-men');
    expect(getSubTypeForModel('LTP-V007L-9B', 'standard')).toBe('st-lady');
    expect(getSubTypeForModel('A168WA-1', 'standard')).toBe('st-digi');
  });
});

describe('parseCasioModel', () => {
  it('parses material and color per doc §30', () => {
    expect(parseCasioModel('MTP-1302D-7A2')).toEqual({ mat: 'D', color: '7' });
    expect(parseCasioModel('LTP-V007L-9B')).toEqual({ mat: 'L', color: '9' });
    expect(parseCasioModel('MTP-VD01G-1E')).toEqual({ mat: 'G', color: '1' });
    expect(parseCasioModel('GA-2100-1A')).toEqual({ mat: '', color: '1' });
    expect(parseCasioModel('EFR-539D-2A')).toEqual({ mat: 'D', color: '2' });
  });
  it('ignores non-material suffixes like HC in W-219HC', () => {
    expect(parseCasioModel('W-219HC-3B')).toEqual({ mat: '', color: '3' });
  });
});

describe('enrichCasioFromModelCode', () => {
  it('enriches W-219HC-3B', () => {
    const e = enrichCasioFromModelCode('W-219HC-3B');
    expect(e.model_base).toBe('W-219HC');
    expect(e.watch_series).toBe('standard');
    expect(e.watch_sub_type).toBe('st-digi');
    expect(e.dial_color_code).toBe('3');
    expect(e.strap_material).toBe('R');
  });
});

describe('getProductDisplayLines', () => {
  it('returns two lines when base differs from full', () => {
    const lines = getProductDisplayLines({ sku_name: 'W-219HC-3B' });
    expect(lines.title).toBe('W-219HC');
    expect(lines.subtitle).toBe('W-219HC-3B');
  });
});
