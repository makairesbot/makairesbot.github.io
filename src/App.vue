<template>
    <div class="window-border">
        <div class="top-container">
            <div class="button-container">
                <div class="sunstone-icon"></div><span class="stone-font">{{stonecount}}</span><span class="stone-font" style="margin-left: 8px; margin-right: 8px;">|</span> <!--Maybe display type g stonecount in smaller text below this?-->
                <div class="type-g-icon" style="margin-bottom: 24px; margin-right: 4px;"></div><span style="font-size: 17pt;" class="stone-font">{{getGStoneCount}}</span>
            </div>
            <div class="button-container">
                <button @click="legacyTab = true" class="top-buttons" :class="{'top-buttons-open': legacyTab}"><span >Legacies</span></button>
                <button @click="legacyTab = false" class="top-buttons" :class="{'top-buttons-open': !legacyTab}">Setup</button>
            </div>
            <div class="button-container" style="text-align: center;">
                Import stones/devices<br>on next load <input style="margin-left: 4px;" type="checkbox" id="checkbox" v-model="autosave" />
                <div style="display: flex; flex-direction: column; margin-left: 12px">
                    <button @click="saveStats()" style="width: 50px; height: 30px;">Save</button>
                    <button @click="loadStats()" style="width: 50px; height: 30px;">Load</button>
                    <button @click="clearData()" style="width: 50px; height: 30px;">Clear</button>
                </div>
            </div>
        </div>

<!--
            <div @click="legacyClick()" class="legacy-container" :style="{border: borderColor('')}" id=""></div>
-->
        <div class="legacy-display">
            <div v-for="item in legacyList" @click.exact="legacyClick(item.id)" class="legacy-container legacy-container-text" :style="{border: borderColor(item.id)}" :class="item.id">

                <span v-show="!legacyTab" class="legacy-text">{{ deviceList[item.id as keyof typeof deviceList] }}</span>
                <span v-show="legacyTab" class="legacy-text cost-text">{{ getLegacyPrice(item.id, useTypeG, useDot) }}</span>
            </div>
            <div style="width:468px"></div>
            <div style="display: flex; flex-direction: row; justify-content: right;" v-show="legacyTab">
                <div style="justify-content: left; display: flex; flex-direction: row;" class="type-g-icon"></div>
                <input style="margin-left: 4px; margin-top: 24px;" type="checkbox" id="checkbox" v-model="useTypeG" />

                <div style="margin-left: 24px; justify-content: left; display: flex; flex-direction: row; width: 28px; height: 28px;" class="dot type-g-icon"></div>
                <input style="margin-left: 4px; margin-top: 24px;" type="checkbox" id="checkbox" v-model="useDot" :disabled="!dotSelected" />
            </div>
            <button @click="clearDevices()" style="height: 30px; margin-top: 6px;" v-show="!legacyTab">Clear Devices</button>
        </div>

        <div class="bottom-container" v-show="legacyTab">
            <div class="selected-stats"> <!--Left panel, split selected legacies-->
                <div class="selected-legacy-container" style="min-height: 60px; margin-top: 20px; align-items: center;">
                    <div class="sunstone-icon" style="margin-right: 2px; margin-left: 2px;"></div>
                    <div v-for="item, index in selectedNormalLegacies" @click="selectedNormalLegacyClick(item, index)" class="legacy-container legacy-container-text" style="" :class="item">
                        <span class="legacy-text cost-text">{{ getSelectedPrice(item, false, false, index) }}</span>
                    </div>
                </div>
                <div class="selected-legacy-container" style="min-height: 60px; margin-top: 20px; align-items: center;">
                    <div class="type-g-icon" style="margin-bottom: 24px;"></div>
                    <div v-for="item, index in selectedTypeGLegacies" @click="selectedTypeGLegacyClick(item, index)" class="legacy-container legacy-container-text" style="" :class="item">
                        <span class="legacy-text cost-text">{{ getSelectedPrice(item, true, false, index) }}</span>
                    </div>
                </div>
                <div class="selected-legacy-container" style="min-height: 60px; margin-top: 20px; align-items: center;">
                    <div style="margin-bottom: 20px; justify-content: left; display: flex; flex-direction: row; width: 28px; height: 28px;" class="dot type-g-icon"></div>
                    <div v-show="selectedDotLegacy[0] != ''" @click="selectedDotLegacyClick()" class="legacy-container legacy-container-text" style="" :class="selectedDotLegacy[0]">
                        <span class="legacy-text cost-text">{{ getLegacyPrice(selectedDotLegacy[0] as string, selectedDotLegacy[1] as boolean, true) }}</span>
                    </div>
                </div>
            </div>
            <div class="selected-stats"> <!--right panel, Stats:tm:-->
                total normal legacy cost: {{ getTotalSelectedNormalCost }}<br />
                total including type g cost: {{ getTotalCost }}<br />
                remaining stones before G: {{ getTotalRemaining }}<br />
                remaining stones after G: {{ getTotalRemainingG }}
            </div>
            <!--Split left/right
            left: split top/bottom, normal legacies top g legacies bottom | right: stats, like how many stones left, -->
        </div>

        <div class="bottom-container" v-show="!legacyTab && activeLegacy">
            <div class="legacy-container" :class="legacyList[activeLegacy as keyof typeof legacyList].id"></div>
            <select style="width: 100px; height: 30px;" v-model="deviceList[activeLegacy as keyof typeof deviceList]">
                <option v-for="n in legacyList[activeLegacy as keyof typeof legacyList].levelCost.length">{{ n }}</option>
            </select>
            <div style="margin-left: 12px;" class="sunstone-icon"></div><input style="width: 100px; height: 20px; margin-left: 4px;" v-model="stonecount" placeholder="edit me" />
        </div>
    </div>
</template>







<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { tempMiracle } from '@/components/types/tempMiracle.ts'

const saveStats = function() {
    let save = {
        autosave: autosave.value,
        devices: {},
        stones: stonecount.value
    }
    Object.assign(save.devices, deviceList.value)
    localStorage.setItem('tnstatsave', JSON.stringify(save));
}

const loadStats = function() {
    const info = localStorage.getItem('tnstatsave')
    if(info) {
        let save = JSON.parse(info)
        autosave.value = save.autosave;
        Object.assign(deviceList.value, save.devices);
        stonecount.value = save.stones;
    }
    else {
        console.log("No save found.")
    }
}

const autosaveFunction = function() {
    if(autosave.value) {
        saveStats();
    }
}

const clearData = function() {
    localStorage.removeItem('tnstatsave');
}

const autosaveTimer = function() {
    setInterval(autosaveFunction, 5000);
}

onMounted(() => {
    console.log("mounted")
    const info = localStorage.getItem('tnstatsave')
    if(info) {
        let save = JSON.parse(info)
        if(save.autosave) {
            autosave.value = save.autosave;
            Object.assign(deviceList.value, save.devices);
            stonecount.value = save.stones;
        }
    }
    document.addEventListener('keydown', swap);
    autosaveTimer();
});



let legacyTab = ref(true)
let stonecount = ref(0);
let stonesUsed = ref(0);

const autosave = ref(false);
const useTypeG = ref(false);
const useDot = ref(false);
const activeLegacy = ref("smattock");
const usedTempMiracles = ref<tempMiracle[]>([]);
const selectedNormalLegacies = ref<string[]>([]);
const selectedTypeGLegacies = ref<string[]>([]);
const selectedDotLegacy = ref(["", false])

const swap = function(e: any) {
    e.key == 'g' ? useTypeG.value = !useTypeG.value : null;
}

const getGStoneCount = computed(() => {
    return Math.floor(stonecount.value * 1.5);
});

const dotSelected = computed(() => {
    let dot = false;
    if(selectedNormalLegacies.value.includes("dot") || selectedTypeGLegacies.value.includes("dot")) {
        dot = true;
    }
    return dot;
})

const legacyClick = function(legacy: string) {
    if(legacyTab.value) {
        if(useTypeG.value) {
            let add = false; //the way this all got so fuckin messy when i realized i gotta somehow account for temp miracle
            let addDot = false;
            if(legacy == "temp") {
                let levelIndex = Number(deviceList.value.temp) + 2;
                let numUses = Math.min(legacyList.temp.uses[levelIndex], 5);
                if(useDot.value && usedTempMiracles.value.length+1 <= numUses+1) {
                    add = true;
                    addDot = true;
                    usedTempMiracles.value.push({typeg: true, dot: true} as tempMiracle);
                }
                else if(usedTempMiracles.value.length+1 <= numUses) {
                    add = true;
                    usedTempMiracles.value.push({typeg: true} as tempMiracle);
                }
            }
            else if(selectedTypeGLegacies.value.includes(legacy)) {
                if(legacyList[legacy as keyof typeof legacyList].solar) {
                    add = true;
                }
            }
            else {
                add = true;
            }
            if(useDot.value && legacyList[legacy as keyof typeof legacyList].solar) {
                add = true;
                addDot = true;
            }
            if(add) {
                if(addDot) {
                    selectedDotLegacy.value[0] = legacy;
                    selectedDotLegacy.value[1] = true;
                }
                else {
                    selectedTypeGLegacies.value.push(legacy);
                }
            }
        }
        else {
            let add = false;
            let addDot = false;
            if(legacy == "temp") {
                let levelIndex = deviceList.value.temp - 1;
                let numUses = Math.min(legacyList.temp.uses[levelIndex], 5);
                if(useDot.value && usedTempMiracles.value.length+1 <= numUses+1) {
                    add = true;
                    addDot = true;
                    usedTempMiracles.value.push({typeg: false, dot: true} as tempMiracle);
                }
                else if(usedTempMiracles.value.length+1 <= numUses) {
                    add = true;
                    usedTempMiracles.value.push({typeg: false} as tempMiracle);
                }
            }
            else if(!selectedNormalLegacies.value.includes(legacy)) {
                add = true;
            }
            
            if(useDot.value && legacyList[legacy as keyof typeof legacyList].solar) {
                addDot = true;
                add = true;
            }
            if(add) {
                if(addDot) {
                    selectedDotLegacy.value[0] = legacy;
                    selectedDotLegacy.value[1] = false;
                }
                else {
                    selectedNormalLegacies.value.push(legacy);
                }
            }
        }
    }
    else {
        activeLegacy.value = legacy;
    }
}

const selectedNormalLegacyClick = function(legacy: string, index: number) {
    selectedNormalLegacies.value.splice(index, 1);
    if(legacy == "temp") {
        for(let i = 0; i < usedTempMiracles.value.length; i++) {
            if(!usedTempMiracles.value[i].typeg && !usedTempMiracles.value[i].dot) {
                usedTempMiracles.value.splice(i, 1);
                i = 9
            }
        }
    }
    if(legacy == "dot") {
        useDot.value = false;
    }
}
const selectedTypeGLegacyClick = function(legacy: string, index: number) {
    selectedTypeGLegacies.value.splice(index, 1);
    if(legacy == "temp") {
        for(let i = 0; i < usedTempMiracles.value.length; i++) {
            if(usedTempMiracles.value[i].typeg && !usedTempMiracles.value[i].dot) {
                usedTempMiracles.value.splice(i, 1);
                i = 9
            }
        }
    }
    if(legacy == "dot") {
        useDot.value = false;
    }
}
const selectedDotLegacyClick = function() {
    if(selectedDotLegacy.value[0] == "temp") {
        for(let i = 0; i < usedTempMiracles.value.length; i++) {
            if(usedTempMiracles.value[i].dot) {
                usedTempMiracles.value.splice(i, 1);
                i = 9
            }
        }
    }
    selectedDotLegacy.value[0] = "";
    selectedDotLegacy.value[1] = false;
}

const canAfford = function(legacy: string) {
    let cap = useTypeG.value ? getGStoneCount.value : stonecount.value;
    return stonesUsed.value + getLegacyPrice(legacy, useTypeG.value, useDot.value) > cap ? false : true;
}

const validateSelected = function(legacy: string) {

}


const getCostMod = function(legacy: string, typeg: boolean) {
    let levelIndex = deviceList.value[legacy as keyof typeof deviceList.value] - 1;
    let costIndex = legacyList[legacy as keyof typeof legacyList].levelCost;
    levelIndex = typeg ? Math.min(levelIndex + 3, costIndex.length - 1) : levelIndex;
    return costIndex[levelIndex];
}

const getPercentCost = function(legacy: string, typeg: boolean, dot: boolean) {
    let cost = stonecount.value;
    let costMulti = (getCostMod(legacy, typeg) / 100);

    cost = Math.floor(cost * costMulti);
    if(dot) {
        cost = Math.floor(cost * ((100 - getCostMod("dot", typeg)) / 100));
    }
    return cost;
}

const getFlatCost = function(legacy: string, typeg: boolean, dot?: boolean) {
    let cost = 0;
    cost = getCostMod(legacy, typeg);
    if(dot) {
        cost = Math.floor(cost * ((100 - getCostMod("dot", typeg)) / 100));
    }
    return cost;
}


const getTotalSelectedNormalCost = computed(() => {
    let cost = 0;
    selectedNormalLegacies.value.forEach(element => {
        cost += getLegacyPrice(element, false, false);
    });
    if(!selectedDotLegacy.value[1]) {
        cost += getTotalSelectedDotCost.value;
    }
    if(selectedNormalLegacies.value.includes("temp")) {
        cost -= getLegacyPrice("temp", false, false, true);
    }
    return cost;
});

const getTotalSelectedTypeGCost = computed(() => {
    let cost = 0;
    selectedTypeGLegacies.value.forEach(element => {
        cost += getLegacyPrice(element, true, false);
    });
    if(selectedDotLegacy.value[1]) {
        cost += getTotalSelectedDotCost.value;
    }
    return cost;
});

const getTotalSelectedDotCost = computed(() => {
    return selectedDotLegacy.value[0] == "" ? 0 : getLegacyPrice(selectedDotLegacy.value[0] as string, selectedDotLegacy.value[1] as boolean, true);
})

const getTotalCost = computed(() =>{
    let cost = getTotalSelectedNormalCost.value + getTotalSelectedTypeGCost.value

    if(selectedTypeGLegacies.value.includes("temp") && !selectedNormalLegacies.value.includes("temp")) {
        cost -= getLegacyPrice("temp", true, false, true);
    }
    return cost;
});

const getTotalRemaining = computed(() =>{
    return stonecount.value - getTotalSelectedNormalCost.value;
})
const getTotalRemainingG = computed(() =>{
    return Math.floor(stonecount.value * 1.5) - getTotalCost.value;
})


const getLegacyPrice = function(legacy: string, typeg: boolean, dot: boolean, tempMod?: boolean) {
    let cost = stonecount.value;
    switch(legacy) {
        case "smattock": {
            cost = getPercentCost(legacy, typeg, dot);
            return cost;
            break;
        }
        case "sgate": {
            cost = getPercentCost(legacy, typeg, dot);
            return cost;
            break;
        }
        case "mgate": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        case "sjump": {
            cost = getPercentCost(legacy, typeg, dot);
            return cost;
            break;
        }
        case "swinner": {
            cost = getPercentCost(legacy, typeg, dot);
            return cost;
            break;
        }
        case "sglory": {
            cost = getPercentCost(legacy, typeg, dot);
            return cost;
            break;
        }
        case "sswap": {
            cost = getPercentCost(legacy, typeg, dot);
            return cost;
            break;
        }
        case "scross": {
            cost = getPercentCost(legacy, typeg, dot);
            return cost;
            break;
        }
        case "spave": {
            let floor = cost * .03;
            cost = Math.floor((cost * .2) - getFlatCost(legacy, typeg))
            if(cost < floor) {
                cost = floor;
            }
            return cost;
            break;
        }
        case "soot": {
            cost = getPercentCost(legacy, typeg, dot);
            return cost;
            break;
        }
        case "umattock": {
            cost = getPercentCost(legacy, typeg, dot);
            return cost;
            break;
        }
        case "sblizz": {
            cost = getPercentCost(legacy, typeg, dot);
            return cost;
            break;
        }
        case "temp": {
            if(usedTempMiracles.value.length > 0) {
                cost = getFlatCost(legacy, typeg, dot);
            }
            else {
                cost = 0;
            }
            if(tempMod) {
                if(usedTempMiracles.value.length > 0) {
                    cost = getFlatCost(legacy, typeg, dot); //this does not feel Correct but i am so sick of figuring out better workarounds for this stupid legacy
                }
            }
            return cost;
            break;
        }
        case "dot": {
            return 200;
            break;
        }
        case "smirror": {
            cost = getPercentCost(legacy, typeg, dot);
            return cost;
            break;
        }
        case "rmed": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        case "bbell": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        case "gbless": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        case "elixir": {
            cost = getPercentCost(legacy, typeg, dot);
            return cost;
            break;
        }
        case "gmed": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        case "nexuschild": {
            cost = getPercentCost(legacy, typeg, dot);
            return cost;
            break;
        }
        case "prayer": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        case "fulfilled": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        case "lice": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        case "hbless": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        case "bereaved": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        case "lbless": {
            return 0;
            break;
        }
        case "deja": {
            return 0;
            break;
        }
        case 'mbless': {
            return 1;
            break;
        }
        case "mworld": {
            cost = getPercentCost(legacy, typeg, dot);
            return cost;
            break;
        }
        case "omattock": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        case "summer": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        case "bmed": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        case "pkey": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        case "ssword": {
            cost = getPercentCost(legacy, typeg, dot);
            return cost;
            break;
        }
        case "lsword": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        case "popsicle": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        case "mpop": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        case "dbadge": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        case "abadge": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        case "cbadge": {
            cost = getFlatCost(legacy, typeg);
            return cost;
            break;
        }
        default: {
            return 99999999999;
            break;
        }
    }
}

const getSelectedPrice = function(legacy: string, typeg: boolean, dot: boolean, index: number) {
    let cost = 0;
    if(legacy == "temp") {
        if(typeg) {index += selectedNormalLegacies.value.length};
        if(index != selectedNormalLegacies.value.concat(selectedTypeGLegacies.value).indexOf("temp")) {
            cost = getLegacyPrice(legacy, typeg, dot);
        }
    }
    else cost = getLegacyPrice(legacy, typeg, dot);

    return cost;
}

const borderColor = function(legacy: string) {
    let color = "2px solid rgb(28, 187, 36)";
    if(!canAfford(legacy)) {
        color = "2px solid rgb(221, 22, 48)";
    }

    return color;
}


const deviceList = ref({    
    smattock: 1,
    sgate: 1,
    mgate: 1,
    sjump: 1,
    swinner: 1,
    sglory: 1,
    sswap: 1,
    scross: 1,
    spave: 1,
    soot: 1,
    umattock: 1,
    sblizz: 1,
    temp: 1,
    dot: 1,
    smirror: 1,
    rmed: 1,
    bbell: 1,
    gbless: 1,
    elixir: 1,
    gmed: 1,
    nexuschild: 1,
    prayer: 1,
    fulfilled: 1,
    lice: 1,
    hbless: 1,
    bereaved: 1,
    lbless: 1,
    deja: 1,
    mbless: 1,
    mworld: 1,
    omattock: 1,
    summer: 1,
    bmed: 1,
    pkey: 1,
    ssword: 1,
    lsword: 1,
    popsicle: 1,
    mpop: 1,
    dbadge: 1,
    abadge: 1,
    cbadge: 1
})

const clearDevices = function() {
    deviceList.value = Object.keys(deviceList.value).reduce((acc, curr) => ({...acc, [curr]: 1}), {} as any);
}

const legacyList = {
    smattock: {
        name: "Solar Mattock",
        id: "smattock",
        levelCost: [25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
        solar: true
    },
    sgate: {
        name: "Solar Gate",
        id: "sgate",
        levelCost: [25, 24, 23, 22, 21, 20],
        solar: true
    },
    mgate: {
        name: "Moon Gate",
        id: "mgate",
        levelCost: [200, 180, 160, 140, 120, 100],
        solar: false
    },
    sjump: {
        name: "Solar Orb <Teleport>",
        id: "sjump",
        levelCost: [22, 21, 20, 19, 18, 17, 16, 15, 15, 14, 13, 12, 11, 10],
        solar: true
    },
    swinner: {
        name: "Solar Key <Winner>",
        id: "swinner",
        levelCost: [20, 18, 18, 16, 14, 14, 12, 10, 10],
        solar: true
    },
    sglory: {
        name: "Solar Key <Glory>",
        id: "sglory",
        levelCost: [20, 18, 16, 14, 14, 12, 10, 10],
        solar: true
    },
    sswap: {
        name: "Solar Orb <Swap>",
        id: "sswap",
        levelCost: [18, 17, 16, 15, 14, 13, 12, 12, 11, 10, 9, 8],
        solar: true
    },
    scross: {
        name: "Sunstone Cross",
        id: "scross",
        levelCost: [20, 20, 19, 19, 18, 18, 17, 17, 16, 16, 15, 15, 14, 14, 13, 13, 12, 12, 11, 11, 10],
        solar: true
    },
    spave: {
        name: "Solar Orb <Pave>",
        id: "spave",
        levelCost: [0, 20, 45, 75, 110, 150, 195, 245, 300, 360, 425, 500, 500, 600, 700, 800, 900, 1000, 1150, 1300, 1500, 1500, 2000, 2000],
        solar: true
    },
    soot: {
        name: "Soot of the Blazing Spirit",
        id: "soot",
        levelCost: [12, 11, 11, 10, 10, 9, 9, 8, 8, 7, 7],
        solar: false
    },
    umattock: {
        name: "Ultra Mattock",
        id: "umattock",
        levelCost: [8, 8, 8, 8, 8, 8, 8, 8, 8],
        solar: true
    },
    sblizz: {
        name: "Solar Orb <Blizzard>",
        id: "sblizz",
        levelCost: [30, 29, 28, 27, 26, 25, 24, 23, 22, 22, 21, 20, 19, 18, 17, 16, 15, 15],
        solar: true
    },
    temp: {
        name: "Temporary Miracle",
        id: "temp",
        levelCost: [0, 400, 340, 340, 280, 240, 240, 200, 160, 160, 130, 100],
        uses: [1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5],
        solar: true
    },
    dot: {
        name: "Pendant of Dot",
        id: "dot",
        levelCost: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 34, 38, 42, 42, 46, 50],
        solar: false
    },
    smirror: {
        name: "Solar Orb <Mirror>",
        id: "smirror",
        levelCost: [22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12],
        solar: true
    },
    rmed: {
        name: "Medicine Dictionary (Red)",
        id: "rmed",
        levelCost: [100, 100, 94, 94, 88, 88, 82, 82, 75, 75, 67, 67, 58, 58, 50, 50, 50, 40, 40],
        solar: false
    },
    bbell: {
        name: "Blessing Bell",
        id: "bbell",
        levelCost: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
        solar: false
    },
    gbless: {
        name: "Bless of Guardian",
        id: "gbless",
        levelCost: [150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150],
        solar: false
    },
    elixir: {
        name: "Solar Elixir",
        id: "elixir",
        levelCost: [60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60],
        solar: true
    },
    gmed: {
        name: "Medicine Dictionary (Green)",
        id: "gmed",
        levelCost: [100, 100, 100, 90, 90, 90, 80, 80, 80, 70, 70, 70, 60, 60, 60, 50, 50, 40, 40],
        solar: false
    },
    nexuschild: {
        name: "Pendant of the Nexus Child",
        id: "nexuschild",
        levelCost: [12, 11, 10, 9, 8, 8, 7, 6, 5, 4, 4, 3, 2, 2, 1, 0],
        solar: false
    },
    prayer: {
        name: "Prayer of the Lost",
        id: "prayer",
        levelCost: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
        solar: false
    },
    fulfilled: {
        name: "Gift to the Fulfilled",
        id: "fulfilled",
        levelCost: [500, 460, 420, 380, 340, 300],
        solar: false
    },
    lice: {
        name: "Lunar Key <Ice>",
        id: "lice",
        levelCost: [250, 225, 200, 175, 150, 125, 100, 100],
        solar: false
    },
    hbless: {
        name: "Blessing from Heaven",
        id: "hbless",
        levelCost: [350, 350, 335, 320, 320, 305, 290, 290, 275, 260, 260, 245, 230, 230, 215, 200],
        solar: false
    },
    bereaved: {
        name: "Banishment from Real",
        id: "bereaved",
        levelCost: [800, 775, 750, 725, 700, 675, 650, 625, 600, 575, 550, 525, 500],
        solar: false
    },
    lbless: {
        name: "Bless of the Last One",
        id: "lbless",
        levelCost: [0],
        solar: false
    },
    deja: {
        name: "<Deja>'s Pulse Book'",
        id: "deja",
        levelCost: [0],
        solar: true
    },
    mbless: {
        name: "Modest Bless",
        id: "mbless",
        levelCost: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        solar: false
    },
    mworld: {
        name: "Metal World",
        id: "mworld",
        levelCost: [70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60, 59, 57, 55],
        solar: true
    },
    omattock: {
        name: "Omega Mattock",
        id: "omattock",
        levelCost: [999, 975, 950, 925, 900, 875, 850, 825, 800, 775, 750, 750, 725, 700, 675, 650, 625, 600, 575, 550, 550, 525, 500, 500],
        solar: false
    },
    summer: {
        name: "Memories of Summer",
        id: "summer",
        levelCost: [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0, 0, 0, 0, 0],
        solar: false
    },
    bmed: {
        name: "Medicine Dictionary (Blue)",
        id: "bmed",
        levelCost: [100, 100, 94, 94, 88, 88, 82, 82, 75, 75, 67, 67, 58, 58, 50, 50, 50, 40, 40],
        solar: false
    },
    pkey: {
        name: "Shining Key",
        id: "pkey",
        levelCost: [777, 745, 715, 685, 655, 625, 595, 565, 535, 505, 475, 450, 425, 400, 380, 360, 340, 320, 300, 280, 260, 240, 220, 200],
        solar: true
    },
    ssword: {
        name: "Emblem of an Ordinary Knight",
        id: "ssword",
        levelCost: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        solar: false
    },
    lsword: {
        name: "Young Hero's Emblem",
        id: "lsword",
        levelCost: [500, 485, 470, 455, 440, 425, 410, 390, 370, 350, 325, 300, 270, 240, 200],
        solar: false
    },
    popsicle: {
        name: "Drop of Summer Ocean",
        id: "popsicle",
        levelCost: [50, 50, 50, 40, 40, 40, 30, 30, 30, 20, 20, 20, 10, 10, 10, 0],
        solar: false
    },
    mpop: {
        name: "Cold Sunset Ice",
        id: "mpop",
        levelCost: [50, 40, 30, 20, 10, 0],
        solar: false
    },
    dbadge: {
        name: "Rainbow Badge",
        id: "dbadge",
        levelCost: [10, 10, 5, 5, 5, 0, 0, 0],
        solar: false
    },
    abadge: {
        name: "Aurora Badge",
        id: "abadge",
        levelCost: [10, 10, 5, 5, 5, 0, 0, 0],
        solar: false
    },
    cbadge: {
        name: "Continental Badge from 0",
        id: "cbadge",
        levelCost: [500, 475, 450, 425, 400, 375, 350, 325, 300, 275, 250, 225, 200, 175, 150, 125, 100, 75, 50, 25, 0, 0],
        solar: false
    }   
}



</script>

<style scoped>
.window-border {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: rgb(31, 31, 31);
}

.top-container {
    width: 100%;
    display: flex;
    justify-content: center;
    flex-direction: row;
    margin-top: 20px;
    margin-bottom: 10px;
}

.bottom-container {
    margin-top: 16px;
    width: 1080px;
    display: flex;
}

.legacy-text {
    position: absolute; 
    bottom: 0; 
    right: 0; 
    color: white; 
    -webkit-text-stroke: 2px black; 
    font-size: 28px; 
    font-weight: bold;
}

.legacy-container-text {
    position: relative; 
    line-height: 20px;
}

.cost-text {
    font-size: 1.2em !important;
    color: rgb(109, 255, 153) !important;
    -webkit-text-stroke: .8px black !important;
}

.sunstone-icon {
    width: 28px;
    height: 28px;
    background-repeat: no-repeat;
    background-position: center;
    background-size: 100%;
    background-image: url(./components/icons/sunstone.png);
    margin-right: 4px;
}

.type-g-icon {
    width: 28px;
    height: 28px;
    background-repeat: no-repeat;
    background-position: center;
    background-size: 100%;
    background-image: url(./components/icons/typeg.png);
    margin-left: 4px;
    margin-top: 24px;
}



.button-container {
    width: 300px;
    height: 100px;
    justify-content: center;
    align-items: center;
    display: flex;
    font-family: "tnFont";
}

.legacy-display {
    width: 1080px;
    display: flex;
    justify-content: left;
    flex-wrap: wrap;
}

.selected-stats {
    width: 540px;
    display: flex;
    flex-direction: column;
}

.selected-legacy-container {
    width: 540px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
}


.legacy-container {
    width: 52px;
    height: 52px;
    background-color: rgb(138, 138, 138);
    background-repeat: no-repeat;
    background-position: center;
    margin: 4px;
    background-size: 100%;
    
    user-select: none;
}
.legacy-container:hover {
    background-color: rgb(158, 158, 158);
}
.legacy-container:active {
    box-shadow: inset 0px 0px 6px rgb(15, 15, 15) !important;
    background-color: rgb(88, 88, 88);
}



.smattock {
    background-image: url("./components/icons/smattock.png");
}
.sgate {
    background-image: url("./components/icons/sgate.png");
}
.mgate {
    background-image: url("./components/icons/mgate.png");
}
.sjump {
    background-image: url("./components/icons/sjump.png");
}
.swinner {
    background-image: url("./components/icons/swinner.png");
}
.sglory {
    background-image: url("./components/icons/sglory.png");
}
.sswap {
    background-image: url("./components/icons/sswap.png");
}
.scross {
    background-image: url("./components/icons/scross.png");
}
.spave {
    background-image: url("./components/icons/spave.png");
}
.soot {
    background-image: url("./components/icons/soot.png");
}
.umattock {
    background-image: url("./components/icons/umattock.png");
}
.sblizz {
    background-image: url("./components/icons/sblizz.png");
}
.temp {
    background-image: url("./components/icons/temp.png");
}
.dot {
    background-image: url("./components/icons/dot.png");
}
.smirror {
    background-image: url("./components/icons/smirror.png");
}
.rmed {
    background-image: url("./components/icons/rmed.png");
}
.bbell {
    background-image: url("./components/icons/bbell.png");
}
.gbless {
    background-image: url("./components/icons/gbless.png");
}
.elixir {
    background-image: url("./components/icons/elixir.png");
}
.gmed {
    background-image: url("./components/icons/gmed.png");
}
.nexuschild {
    background-image: url("./components/icons/nexuschild.png");
}
.prayer {
    background-image: url("./components/icons/prayer.png");
}
.fulfilled {
    background-image: url("./components/icons/fulfilled.png");
}
.lice {
    background-image: url("./components/icons/lice.png");
}
.hbless {
    background-image: url("./components/icons/hbless.png");
}
.bereaved {
    background-image: url("./components/icons/bereaved.png");
}
.lbless {
    background-image: url("./components/icons/lbless.png");
}
.deja {
    background-image: url("./components/icons/deja.png");
}
.mbless {
    background-image: url("./components/icons/mbless.png");
}
.mworld {
    background-image: url("./components/icons/mworld.png");
}
.omattock {
    background-image: url("./components/icons/omattock.png");
}
.summer {
    background-image: url("./components/icons/summer.png");
}
.bmed {
    background-image: url("./components/icons/bmed.png");
}
.pkey {
    background-image: url("./components/icons/pkey.png");
}
.ssword {
    background-image: url("./components/icons/ssword.png");
}
.lsword {
    background-image: url("./components/icons/lsword.png");
}
.popsicle {
    background-image: url("./components/icons/popsicle.png");
}
.mpop {
    background-image: url("./components/icons/mpop.png");
}
.dbadge {
    background-image: url("./components/icons/dbadge.png");
}
.abadge {
    background-image: url("./components/icons/abadge.png");
}
.cbadge {
    background-image: url("./components/icons/cbadge.png");
}



button {
    border: 1px solid rgb(0, 140, 255);
    border-radius: 10px;
    background-color: rgb(55, 64, 77);
    color: rgb(247, 247, 247);
    transition: background-color 0.2s, color 0.4s, box-shadow 0.02s ease-out;
    font-family: inherit;
    font-size: 1em; 
}
button:active {
    box-shadow: inset 0px 0px 5px rgb(15, 15, 15);
}

button[disabled] {
    background-color: rgb(117, 117, 117);
    pointer-events: none;
}

button:hover {
    background-color: rgb(71, 83, 100);
    color: rgb(12, 12, 12);
}

.top-buttons {
    width: 140px;
    height: 50px;
    margin-left: 5px;
    margin-right: 5px;
    font-size: x-large;
}
.top-buttons-open {
    color: gold;
}


.stone-font {
    background: linear-gradient(180deg,#ffea36 25%,#eac20e,#c39b00 75%);  /* thank you tarrik for this particular setup */
    background-clip: text;
    -webkit-text-fill-color: transparent;
    display: inline-block;
    -webkit-text-stroke: .6px #000;
    font-size: 20pt;
}

@font-face {
  font-family: tnFont;
  src: url(./assets/MTLmr3m.ttf);
}
</style>
