//#! /usr/local/bin/node

import path from "node:path";
import {generateServiceWorker, Options, Plan} from "./generate.mjs";
import * as fs from "fs";

const filePath = process.argv[process.argv.length - 1];

const rawJson = fs.readFileSync(path.join(process.cwd(), filePath))

const json = JSON.parse(rawJson.toString()) as { plan: Plan, options: Options }

const js = generateServiceWorker(json.plan, json.options || {})

console.log(js)
