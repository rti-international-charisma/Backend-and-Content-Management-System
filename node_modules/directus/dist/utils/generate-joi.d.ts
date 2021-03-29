import { Filter } from '../types';
import { AnySchema } from 'joi';
export default function generateJoi(filter: Filter | null): AnySchema;
