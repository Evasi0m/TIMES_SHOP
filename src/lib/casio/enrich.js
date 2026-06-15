import { getCasioModelBase, getPrefix, parseCasioModel } from './parse-model.js';
import { getSeries } from './series-rules.js';
import { getSubTypeForModel } from './sub-type-rules.js';

/** Derive filter/display fields from a CASIO model code. */
export function enrichCasioFromModelCode(code) {
  const model = String(code || '').trim().toUpperCase();
  if (!model) {
    return {
      model_base: '',
      watch_series: 'standard',
      watch_sub_type: null,
      casio_prefix: '',
      strap_material: 'R',
      dial_color_code: '',
    };
  }

  const parsed = parseCasioModel(model);
  const watch_series = getSeries(model);
  const watch_sub_type = getSubTypeForModel(model, watch_series);

  return {
    model_base: getCasioModelBase(model),
    watch_series,
    watch_sub_type,
    casio_prefix: getPrefix(model),
    strap_material: parsed.mat || 'R',
    dial_color_code: parsed.color || '',
  };
}
