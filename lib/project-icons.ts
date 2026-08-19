'use client';

import {
  Bird, Bug, Cat, Dog, Egg, Fish, Mouse, PawPrint, Rabbit, Rat,
  Shell, Squirrel, Turtle, Worm, Feather, Beef,
} from 'lucide-react';
import {
  GiFox, GiFoxHead, GiWolfHead, GiWolfHowl, GiBearFace, GiBearHead, GiPolarBear,
  GiRabbit, GiRabbitHead, GiOwl, GiEagleHead, GiHawkEmblem, GiRaven, GiCrowDive,
  GiSnake, GiRattlesnake, GiTurtle, GiSeaTurtle, GiSharkFin, GiSharkJaws,
  GiDolphin, GiOctopus, GiCrab, GiScorpion, GiFrog, GiButterfly, GiDeer,
  GiDeerHead, GiHorseHead, GiRam, GiRamProfile, GiGoat, GiSheep, GiBull,
  GiBullHorns, GiPig, GiPigFace, GiChicken, GiDuck, GiPenguin, GiParrotHead,
  GiKoala, GiKangaroo, GiPanda, GiElephant, GiElephantHead, GiLion, GiTigerHead,
  GiMonkey, GiSquirrel, GiHedgehog, GiRat, GiBee, GiAnt, GiDragonHead,
  GiUnicorn, GiFlamingo,
} from 'react-icons/gi';
import type { ComponentType } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyIcon = ComponentType<any>;

export interface ProjectIconEntry {
  key: string;
  label: string;
  component: AnyIcon;
}

export const PROJECT_ICONS: ProjectIconEntry[] = [
  { key: 'lucide:Bird',      label: 'Bird',         component: Bird },
  { key: 'lucide:Bug',       label: 'Bug',          component: Bug },
  { key: 'lucide:Cat',       label: 'Cat',          component: Cat },
  { key: 'lucide:Dog',       label: 'Dog',          component: Dog },
  { key: 'lucide:Egg',       label: 'Egg',          component: Egg },
  { key: 'lucide:Fish',      label: 'Fish',         component: Fish },
  { key: 'lucide:Mouse',     label: 'Mouse',        component: Mouse },
  { key: 'lucide:PawPrint',  label: 'Paw Print',    component: PawPrint },
  { key: 'lucide:Rabbit',    label: 'Rabbit',       component: Rabbit },
  { key: 'lucide:Rat',       label: 'Rat',          component: Rat },
  { key: 'lucide:Shell',     label: 'Shell',        component: Shell },
  { key: 'lucide:Squirrel',  label: 'Squirrel',     component: Squirrel },
  { key: 'lucide:Turtle',    label: 'Turtle',       component: Turtle },
  { key: 'lucide:Worm',      label: 'Worm',         component: Worm },
  { key: 'lucide:Feather',   label: 'Feather',      component: Feather },
  { key: 'lucide:Beef',      label: 'Beef',         component: Beef },
  { key: 'gi:GiFox',         label: 'Fox',          component: GiFox },
  { key: 'gi:GiFoxHead',     label: 'Fox Head',     component: GiFoxHead },
  { key: 'gi:GiWolfHead',    label: 'Wolf Head',    component: GiWolfHead },
  { key: 'gi:GiWolfHowl',    label: 'Wolf Howl',    component: GiWolfHowl },
  { key: 'gi:GiBearFace',    label: 'Bear Face',    component: GiBearFace },
  { key: 'gi:GiBearHead',    label: 'Bear Head',    component: GiBearHead },
  { key: 'gi:GiPolarBear',   label: 'Polar Bear',   component: GiPolarBear },
  { key: 'gi:GiRabbit',      label: 'Rabbit (GI)',  component: GiRabbit },
  { key: 'gi:GiRabbitHead',  label: 'Rabbit Head',  component: GiRabbitHead },
  { key: 'gi:GiOwl',         label: 'Owl',          component: GiOwl },
  { key: 'gi:GiEagleHead',   label: 'Eagle Head',   component: GiEagleHead },
  { key: 'gi:GiHawkEmblem',  label: 'Hawk',         component: GiHawkEmblem },
  { key: 'gi:GiRaven',       label: 'Raven',        component: GiRaven },
  { key: 'gi:GiCrowDive',    label: 'Crow',         component: GiCrowDive },
  { key: 'gi:GiSnake',       label: 'Snake',        component: GiSnake },
  { key: 'gi:GiRattlesnake', label: 'Rattlesnake',  component: GiRattlesnake },
  { key: 'gi:GiTurtle',      label: 'Turtle (GI)',  component: GiTurtle },
  { key: 'gi:GiSeaTurtle',   label: 'Sea Turtle',   component: GiSeaTurtle },
  { key: 'gi:GiSharkFin',    label: 'Shark Fin',    component: GiSharkFin },
  { key: 'gi:GiSharkJaws',   label: 'Shark Jaws',   component: GiSharkJaws },
  { key: 'gi:GiDolphin',     label: 'Dolphin',      component: GiDolphin },
  { key: 'gi:GiOctopus',     label: 'Octopus',      component: GiOctopus },
  { key: 'gi:GiCrab',        label: 'Crab',         component: GiCrab },
  { key: 'gi:GiScorpion',    label: 'Scorpion',     component: GiScorpion },
  { key: 'gi:GiFrog',        label: 'Frog',         component: GiFrog },
  { key: 'gi:GiButterfly',   label: 'Butterfly',    component: GiButterfly },
  { key: 'gi:GiDeer',        label: 'Deer',         component: GiDeer },
  { key: 'gi:GiDeerHead',    label: 'Deer Head',    component: GiDeerHead },
  { key: 'gi:GiHorseHead',   label: 'Horse Head',   component: GiHorseHead },
  { key: 'gi:GiRam',         label: 'Ram',          component: GiRam },
  { key: 'gi:GiRamProfile',  label: 'Ram Profile',  component: GiRamProfile },
  { key: 'gi:GiGoat',        label: 'Goat',         component: GiGoat },
  { key: 'gi:GiSheep',       label: 'Sheep',        component: GiSheep },
  { key: 'gi:GiBull',        label: 'Bull',         component: GiBull },
  { key: 'gi:GiBullHorns',   label: 'Bull Horns',   component: GiBullHorns },
  { key: 'gi:GiPig',         label: 'Pig',          component: GiPig },
  { key: 'gi:GiPigFace',     label: 'Pig Face',     component: GiPigFace },
  { key: 'gi:GiChicken',     label: 'Chicken',      component: GiChicken },
  { key: 'gi:GiDuck',        label: 'Duck',         component: GiDuck },
  { key: 'gi:GiPenguin',     label: 'Penguin',      component: GiPenguin },
  { key: 'gi:GiParrotHead',  label: 'Parrot',       component: GiParrotHead },
  { key: 'gi:GiKoala',       label: 'Koala',        component: GiKoala },
  { key: 'gi:GiKangaroo',    label: 'Kangaroo',     component: GiKangaroo },
  { key: 'gi:GiPanda',       label: 'Panda',        component: GiPanda },
  { key: 'gi:GiElephant',    label: 'Elephant',     component: GiElephant },
  { key: 'gi:GiElephantHead',label: 'Elephant Head',component: GiElephantHead },
  { key: 'gi:GiLion',        label: 'Lion',         component: GiLion },
  { key: 'gi:GiTigerHead',   label: 'Tiger',        component: GiTigerHead },
  { key: 'gi:GiMonkey',      label: 'Monkey',       component: GiMonkey },
  { key: 'gi:GiSquirrel',    label: 'Squirrel (GI)',component: GiSquirrel },
  { key: 'gi:GiHedgehog',    label: 'Hedgehog',     component: GiHedgehog },
  { key: 'gi:GiRat',         label: 'Rat (GI)',     component: GiRat },
  { key: 'gi:GiBee',         label: 'Bee',          component: GiBee },
  { key: 'gi:GiAnt',         label: 'Ant',          component: GiAnt },
  { key: 'gi:GiDragonHead',  label: 'Dragon',       component: GiDragonHead },
  { key: 'gi:GiUnicorn',     label: 'Unicorn',      component: GiUnicorn },
  { key: 'gi:GiFlamingo',    label: 'Flamingo',     component: GiFlamingo },
];

const _iconMap = new Map<string, AnyIcon>(
  PROJECT_ICONS.map(({ key, component }) => [key, component]),
);

export function resolveIcon(key: string | null | undefined): AnyIcon | null {
  if (!key) return null;
  return _iconMap.get(key) ?? null;
}
