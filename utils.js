import { XMLParser } from "fast-xml-parser";
import { resourceGetTreeLevel } from "./chili.js";

// parse CHILI API XML responses to JSON
export function jsonifyChiliResponse(response) {
    const fastXmlParser = new XMLParser({
        ignoreAttributes: false,
        attrNodeName: false,
        attributeNamePrefix: "",
    });

    let data = fastXmlParser.parse(response);
    const firstKeys = Object.keys(data);
    if (firstKeys.length == 1) {
        if (typeof data[firstKeys[0]] == "object") {
            data = data[firstKeys[0]];
        }
    }
    return data;
}

// Recursively search tree, return found document IDs
export async function getDocIds(tree, docIds, apikey, baseurl) {
    // Check if directory is empty
    if (tree.item != null) {
        // Check if multiple items in directory
        if (tree.item.length != null) {
            for (let i = 0; i < tree.item.length; i++) {
                if (tree.item[i].isFolder != "true") {
                    docIds.push(tree.item[i].id);
                }
                else {
                    // Search next tree down
                    let newTree = await resourceGetTreeLevel('documents', tree.item[i].path, apikey, baseurl)
                    let newTreeResult = newTree.isOK ? newTree.response : "FAILED";
                    if (newTreeResult != "FAILED") {
                        docIds.concat(await getDocIds(newTreeResult, docIds, apikey, baseurl));
                    }
                    else {
                        throw new Error(newTree.error);
                    }
                }
            }
        }
        // Handles edge case of there only being one item in a directory
        else {
            if (tree.item.isFolder != "true") {
                docIds.push(tree.item.id);
            }
            else {
                 // Search next tree down
                 let newTree = await resourceGetTreeLevel('documents', tree.item.path, apikey, baseurl)
                 let newTreeResult = newTree.isOK ? newTree.response : "FAILED";
                 if (newTreeResult != "FAILED") {
                     docIds.concat(await getDocIds(newTreeResult, docIds, apikey, baseurl));
                 }
                 else {
                     throw new Error(newTree.error);
                 }
            }
        }
    }
    return docIds;
}

// Build base url for API
export function buildBaseURL(environment, isSandbox = false) {
    return `https://${environment}.${isSandbox ? "chili-publish-sandbox" : "chili-publish"}.online/rest-api/v1.2`;
}