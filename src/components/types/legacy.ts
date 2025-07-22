export interface LegacyItem {
    name: string;
    id: number;
    desc: string;
    icon?: string;
    lvMax: number;
    levelDesc: string[];
    costType: number;
    levelCost: number[];
    miscLevelNum1?: number[];
    miscLevelNum2?: number[];
    miscLevelNum3?: number[];
}