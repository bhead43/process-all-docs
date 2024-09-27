import * as fs from "fs"
import { buildBaseURL, getDocIds } from "./utils.js";
import { generateAPIKey, resourceGetTreeLevel, documentProcessServerSide } from "./chili.js";

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'))
const baseurl = buildBaseURL(config.environment, config.isSandbox);

// Get API key
const apikeyFetch = await generateAPIKey(config.auth.user, config.auth.pass, config.environment, baseurl);
const apikey = apikeyFetch.isOK ? apikeyFetch.response : "FAILED";
if(apikey == "FAILED"){
    throw new Error(apikeyFetch.error);
}

// Get list of all documents within a given directory (recursive)
const initialTreeFetch = await resourceGetTreeLevel('documents', config.startingDirectory, apikey, baseurl);
const initialTree = initialTreeFetch.isOK ? initialTreeFetch.response : "FAILED";
if(initialTree == "FAILED"){
    throw new Error(initialTreeFetch.error);
}
const docIds = await getDocIds(initialTree, [], apikey, baseurl)

// Run each doc in list through DocumentProcessServerSide endpoint 
for(let i = 0; i < docIds.length; i++){
    await documentProcessServerSide(docIds[i], apikey, baseurl);
}