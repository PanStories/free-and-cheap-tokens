/**
 * ajv 严格校验。加载 schema 后输出 `validate(promo)`。
 * Schema 是 `schemas/promo.schema.json` (Draft 2020-12)。
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import type { ErrorObject } from 'ajv';

const here = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(here, '..', '..', 'schemas', 'promo.schema.json');

type Validator = ((data: unknown) => boolean) & { errors?: ErrorObject[] | null };

let _validate: Validator | null = null;

export function getValidator(): Validator {
  if (_validate) return _validate;

  const ajv = new Ajv2020({
    strict: true,
    allErrors: true,
    allowUnionTypes: false,
  });
  addFormats(ajv);

  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
  const v = ajv.compile(schema) as Validator;
  _validate = v;
  return v;
}

/**
 * 校验一条 promo。返回 `{ ok: true }` 或 `{ ok: false, errors: [...] }`。
 */
export function validatePromo(data: unknown): { ok: true } | { ok: false; errors: string[] } {
  const v = getValidator();
  if (v(data)) return { ok: true };
  const errs = (v.errors ?? []).map(formatErr);
  return { ok: false, errors: errs };
}

function formatErr(e: ErrorObject): string {
  const path = e.instancePath || '/';
  const msg = e.message ?? 'invalid';
  const params = Object.keys(e.params ?? {}).length
    ? ` (${JSON.stringify(e.params)})`
    : '';
  return `${path} ${msg}${params}`;
}