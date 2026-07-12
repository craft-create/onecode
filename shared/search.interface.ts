import type { MaterialItem } from './material.interface';
import type { ScriptProjectItem } from './script.interface';
import type { TopCreator } from './home.interface';

export interface SearchResponse {
  materials: MaterialItem[];
  scripts: ScriptProjectItem[];
  creators: TopCreator[];
}
