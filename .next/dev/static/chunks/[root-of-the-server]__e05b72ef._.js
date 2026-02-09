(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[turbopack]/browser/dev/hmr-client/hmr-client.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/// <reference path="../../../shared/runtime-types.d.ts" />
/// <reference path="../../runtime/base/dev-globals.d.ts" />
/// <reference path="../../runtime/base/dev-protocol.d.ts" />
/// <reference path="../../runtime/base/dev-extensions.ts" />
__turbopack_context__.s([
    "connect",
    ()=>connect,
    "setHooks",
    ()=>setHooks,
    "subscribeToUpdate",
    ()=>subscribeToUpdate
]);
function connect({ addMessageListener, sendMessage, onUpdateError = console.error }) {
    addMessageListener((msg)=>{
        switch(msg.type){
            case 'turbopack-connected':
                handleSocketConnected(sendMessage);
                break;
            default:
                try {
                    if (Array.isArray(msg.data)) {
                        for(let i = 0; i < msg.data.length; i++){
                            handleSocketMessage(msg.data[i]);
                        }
                    } else {
                        handleSocketMessage(msg.data);
                    }
                    applyAggregatedUpdates();
                } catch (e) {
                    console.warn('[Fast Refresh] performing full reload\n\n' + "Fast Refresh will perform a full reload when you edit a file that's imported by modules outside of the React rendering tree.\n" + 'You might have a file which exports a React component but also exports a value that is imported by a non-React component file.\n' + 'Consider migrating the non-React component export to a separate file and importing it into both files.\n\n' + 'It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh.\n' + 'Fast Refresh requires at least one parent function component in your React tree.');
                    onUpdateError(e);
                    location.reload();
                }
                break;
        }
    });
    const queued = globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS;
    if (queued != null && !Array.isArray(queued)) {
        throw new Error('A separate HMR handler was already registered');
    }
    globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS = {
        push: ([chunkPath, callback])=>{
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    };
    if (Array.isArray(queued)) {
        for (const [chunkPath, callback] of queued){
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    }
}
const updateCallbackSets = new Map();
function sendJSON(sendMessage, message) {
    sendMessage(JSON.stringify(message));
}
function resourceKey(resource) {
    return JSON.stringify({
        path: resource.path,
        headers: resource.headers || null
    });
}
function subscribeToUpdates(sendMessage, resource) {
    sendJSON(sendMessage, {
        type: 'turbopack-subscribe',
        ...resource
    });
    return ()=>{
        sendJSON(sendMessage, {
            type: 'turbopack-unsubscribe',
            ...resource
        });
    };
}
function handleSocketConnected(sendMessage) {
    for (const key of updateCallbackSets.keys()){
        subscribeToUpdates(sendMessage, JSON.parse(key));
    }
}
// we aggregate all pending updates until the issues are resolved
const chunkListsWithPendingUpdates = new Map();
function aggregateUpdates(msg) {
    const key = resourceKey(msg.resource);
    let aggregated = chunkListsWithPendingUpdates.get(key);
    if (aggregated) {
        aggregated.instruction = mergeChunkListUpdates(aggregated.instruction, msg.instruction);
    } else {
        chunkListsWithPendingUpdates.set(key, msg);
    }
}
function applyAggregatedUpdates() {
    if (chunkListsWithPendingUpdates.size === 0) return;
    hooks.beforeRefresh();
    for (const msg of chunkListsWithPendingUpdates.values()){
        triggerUpdate(msg);
    }
    chunkListsWithPendingUpdates.clear();
    finalizeUpdate();
}
function mergeChunkListUpdates(updateA, updateB) {
    let chunks;
    if (updateA.chunks != null) {
        if (updateB.chunks == null) {
            chunks = updateA.chunks;
        } else {
            chunks = mergeChunkListChunks(updateA.chunks, updateB.chunks);
        }
    } else if (updateB.chunks != null) {
        chunks = updateB.chunks;
    }
    let merged;
    if (updateA.merged != null) {
        if (updateB.merged == null) {
            merged = updateA.merged;
        } else {
            // Since `merged` is an array of updates, we need to merge them all into
            // one, consistent update.
            // Since there can only be `EcmascriptMergeUpdates` in the array, there is
            // no need to key on the `type` field.
            let update = updateA.merged[0];
            for(let i = 1; i < updateA.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateA.merged[i]);
            }
            for(let i = 0; i < updateB.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateB.merged[i]);
            }
            merged = [
                update
            ];
        }
    } else if (updateB.merged != null) {
        merged = updateB.merged;
    }
    return {
        type: 'ChunkListUpdate',
        chunks,
        merged
    };
}
function mergeChunkListChunks(chunksA, chunksB) {
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    return chunks;
}
function mergeChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted' || updateA.type === 'deleted' && updateB.type === 'added') {
        return undefined;
    }
    if (updateA.type === 'partial') {
        invariant(updateA.instruction, 'Partial updates are unsupported');
    }
    if (updateB.type === 'partial') {
        invariant(updateB.instruction, 'Partial updates are unsupported');
    }
    return undefined;
}
function mergeChunkListEcmascriptMergedUpdates(mergedA, mergedB) {
    const entries = mergeEcmascriptChunkEntries(mergedA.entries, mergedB.entries);
    const chunks = mergeEcmascriptChunksUpdates(mergedA.chunks, mergedB.chunks);
    return {
        type: 'EcmascriptMergedUpdate',
        entries,
        chunks
    };
}
function mergeEcmascriptChunkEntries(entriesA, entriesB) {
    return {
        ...entriesA,
        ...entriesB
    };
}
function mergeEcmascriptChunksUpdates(chunksA, chunksB) {
    if (chunksA == null) {
        return chunksB;
    }
    if (chunksB == null) {
        return chunksA;
    }
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeEcmascriptChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    if (Object.keys(chunks).length === 0) {
        return undefined;
    }
    return chunks;
}
function mergeEcmascriptChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted') {
        // These two completely cancel each other out.
        return undefined;
    }
    if (updateA.type === 'deleted' && updateB.type === 'added') {
        const added = [];
        const deleted = [];
        const deletedModules = new Set(updateA.modules ?? []);
        const addedModules = new Set(updateB.modules ?? []);
        for (const moduleId of addedModules){
            if (!deletedModules.has(moduleId)) {
                added.push(moduleId);
            }
        }
        for (const moduleId of deletedModules){
            if (!addedModules.has(moduleId)) {
                deleted.push(moduleId);
            }
        }
        if (added.length === 0 && deleted.length === 0) {
            return undefined;
        }
        return {
            type: 'partial',
            added,
            deleted
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'partial') {
        const added = new Set([
            ...updateA.added ?? [],
            ...updateB.added ?? []
        ]);
        const deleted = new Set([
            ...updateA.deleted ?? [],
            ...updateB.deleted ?? []
        ]);
        if (updateB.added != null) {
            for (const moduleId of updateB.added){
                deleted.delete(moduleId);
            }
        }
        if (updateB.deleted != null) {
            for (const moduleId of updateB.deleted){
                added.delete(moduleId);
            }
        }
        return {
            type: 'partial',
            added: [
                ...added
            ],
            deleted: [
                ...deleted
            ]
        };
    }
    if (updateA.type === 'added' && updateB.type === 'partial') {
        const modules = new Set([
            ...updateA.modules ?? [],
            ...updateB.added ?? []
        ]);
        for (const moduleId of updateB.deleted ?? []){
            modules.delete(moduleId);
        }
        return {
            type: 'added',
            modules: [
                ...modules
            ]
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'deleted') {
        // We could eagerly return `updateB` here, but this would potentially be
        // incorrect if `updateA` has added modules.
        const modules = new Set(updateB.modules ?? []);
        if (updateA.added != null) {
            for (const moduleId of updateA.added){
                modules.delete(moduleId);
            }
        }
        return {
            type: 'deleted',
            modules: [
                ...modules
            ]
        };
    }
    // Any other update combination is invalid.
    return undefined;
}
function invariant(_, message) {
    throw new Error(`Invariant: ${message}`);
}
const CRITICAL = [
    'bug',
    'error',
    'fatal'
];
function compareByList(list, a, b) {
    const aI = list.indexOf(a) + 1 || list.length;
    const bI = list.indexOf(b) + 1 || list.length;
    return aI - bI;
}
const chunksWithIssues = new Map();
function emitIssues() {
    const issues = [];
    const deduplicationSet = new Set();
    for (const [_, chunkIssues] of chunksWithIssues){
        for (const chunkIssue of chunkIssues){
            if (deduplicationSet.has(chunkIssue.formatted)) continue;
            issues.push(chunkIssue);
            deduplicationSet.add(chunkIssue.formatted);
        }
    }
    sortIssues(issues);
    hooks.issues(issues);
}
function handleIssues(msg) {
    const key = resourceKey(msg.resource);
    let hasCriticalIssues = false;
    for (const issue of msg.issues){
        if (CRITICAL.includes(issue.severity)) {
            hasCriticalIssues = true;
        }
    }
    if (msg.issues.length > 0) {
        chunksWithIssues.set(key, msg.issues);
    } else if (chunksWithIssues.has(key)) {
        chunksWithIssues.delete(key);
    }
    emitIssues();
    return hasCriticalIssues;
}
const SEVERITY_ORDER = [
    'bug',
    'fatal',
    'error',
    'warning',
    'info',
    'log'
];
const CATEGORY_ORDER = [
    'parse',
    'resolve',
    'code generation',
    'rendering',
    'typescript',
    'other'
];
function sortIssues(issues) {
    issues.sort((a, b)=>{
        const first = compareByList(SEVERITY_ORDER, a.severity, b.severity);
        if (first !== 0) return first;
        return compareByList(CATEGORY_ORDER, a.category, b.category);
    });
}
const hooks = {
    beforeRefresh: ()=>{},
    refresh: ()=>{},
    buildOk: ()=>{},
    issues: (_issues)=>{}
};
function setHooks(newHooks) {
    Object.assign(hooks, newHooks);
}
function handleSocketMessage(msg) {
    sortIssues(msg.issues);
    handleIssues(msg);
    switch(msg.type){
        case 'issues':
            break;
        case 'partial':
            // aggregate updates
            aggregateUpdates(msg);
            break;
        default:
            // run single update
            const runHooks = chunkListsWithPendingUpdates.size === 0;
            if (runHooks) hooks.beforeRefresh();
            triggerUpdate(msg);
            if (runHooks) finalizeUpdate();
            break;
    }
}
function finalizeUpdate() {
    hooks.refresh();
    hooks.buildOk();
    // This is used by the Next.js integration test suite to notify it when HMR
    // updates have been completed.
    // TODO: Only run this in test environments (gate by `process.env.__NEXT_TEST_MODE`)
    if (globalThis.__NEXT_HMR_CB) {
        globalThis.__NEXT_HMR_CB();
        globalThis.__NEXT_HMR_CB = null;
    }
}
function subscribeToChunkUpdate(chunkListPath, sendMessage, callback) {
    return subscribeToUpdate({
        path: chunkListPath
    }, sendMessage, callback);
}
function subscribeToUpdate(resource, sendMessage, callback) {
    const key = resourceKey(resource);
    let callbackSet;
    const existingCallbackSet = updateCallbackSets.get(key);
    if (!existingCallbackSet) {
        callbackSet = {
            callbacks: new Set([
                callback
            ]),
            unsubscribe: subscribeToUpdates(sendMessage, resource)
        };
        updateCallbackSets.set(key, callbackSet);
    } else {
        existingCallbackSet.callbacks.add(callback);
        callbackSet = existingCallbackSet;
    }
    return ()=>{
        callbackSet.callbacks.delete(callback);
        if (callbackSet.callbacks.size === 0) {
            callbackSet.unsubscribe();
            updateCallbackSets.delete(key);
        }
    };
}
function triggerUpdate(msg) {
    const key = resourceKey(msg.resource);
    const callbackSet = updateCallbackSets.get(key);
    if (!callbackSet) {
        return;
    }
    for (const callback of callbackSet.callbacks){
        callback(msg);
    }
    if (msg.type === 'notFound') {
        // This indicates that the resource which we subscribed to either does not exist or
        // has been deleted. In either case, we should clear all update callbacks, so if a
        // new subscription is created for the same resource, it will send a new "subscribe"
        // message to the server.
        // No need to send an "unsubscribe" message to the server, it will have already
        // dropped the update stream before sending the "notFound" message.
        updateCallbackSets.delete(key);
    }
}
}),
"[project]/artifacts/contracts/Voting.sol/Voting.json (json)", ((__turbopack_context__) => {

__turbopack_context__.v(JSON.parse("{\"_format\":\"hh-sol-artifact-1\",\"contractName\":\"Voting\",\"sourceName\":\"contracts/voting.sol\",\"abi\":[{\"inputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"id\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"age\",\"type\":\"string\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"name\",\"type\":\"string\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"image\",\"type\":\"string\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"voteCount\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"candidateAddress\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"ipfs\",\"type\":\"string\"}],\"name\":\"CandidateCreated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"id\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"name\",\"type\":\"string\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"image\",\"type\":\"string\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"voterAddress\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"bool\",\"name\":\"allowed\",\"type\":\"bool\"},{\"indexed\":false,\"internalType\":\"bool\",\"name\":\"voted\",\"type\":\"bool\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"vote\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"ipfs\",\"type\":\"string\"}],\"name\":\"VoterCreated\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"candidateAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"name\":\"candidates\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"id\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"age\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"name\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"image\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"voteCount\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"_address\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"ipfs\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getCandidate\",\"outputs\":[{\"internalType\":\"address[]\",\"name\":\"\",\"type\":\"address[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"_address\",\"type\":\"address\"}],\"name\":\"getCandidateData\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"},{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getCandidateLength\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getVotedVoterList\",\"outputs\":[{\"internalType\":\"address[]\",\"name\":\"\",\"type\":\"address[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"_address\",\"type\":\"address\"}],\"name\":\"getVoterData\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"},{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getVoterLength\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getVoterList\",\"outputs\":[{\"internalType\":\"address[]\",\"name\":\"\",\"type\":\"address[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"_address\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"_age\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"_name\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"_image\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"_ipfs\",\"type\":\"string\"}],\"name\":\"setCandidate\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"_candidateAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_candidateId\",\"type\":\"uint256\"}],\"name\":\"vote\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"votedVoters\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"_address\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"_name\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"_image\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"_ipfs\",\"type\":\"string\"}],\"name\":\"voterRight\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"name\":\"voters\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"_id\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"names\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"image\",\"type\":\"string\"},{\"internalType\":\"address\",\"name\":\"_address\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"allowed\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"voted\",\"type\":\"bool\"},{\"internalType\":\"uint256\",\"name\":\"vote\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"ipfs\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"votersAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"votingOrganizer\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"}],\"bytecode\":\"0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506128b9806100606000396000f3fe608060405234801561001057600080fd5b50600436106101005760003560e01c80637831ffb311610097578063a3ec138d11610066578063a3ec138d146102e7578063b28d92ae1461031e578063c91ec7121461033c578063f7522a831461035857610100565b80637831ffb31461022d5780638ab66a901461025d5780638e945685146102935780638fb4cd80146102b157610100565b806343242daa116100d357806343242daa146101a55780635cc48aa7146101d55780635f74bbde146101f357806370218b851461020f57610100565b80630361419e1461010557806305ad45a4146101215780632a466ac71461013f5780633a88251a14610175575b600080fd5b61011f600480360381019061011a9190611bc6565b610376565b005b610129610677565b6040516101369190611c9a565b60405180910390f35b61015960048036038101906101549190611cb5565b610684565b60405161016c9796959493929190611d70565b60405180910390f35b61018f600480360381019061018a9190611e27565b610acb565b60405161019c9190611e54565b60405180910390f35b6101bf60048036038101906101ba9190611e27565b610b0a565b6040516101cc9190611e54565b60405180910390f35b6101dd610b49565b6040516101ea9190611e54565b60405180910390f35b61020d60048036038101906102089190611e6f565b610b6d565b005b610217610d30565b6040516102249190611f6d565b60405180910390f35b61024760048036038101906102429190611e27565b610dbe565b6040516102549190611e54565b60405180910390f35b61027760048036038101906102729190611cb5565b610dfd565b60405161028a9796959493929190611f8f565b60405180910390f35b61029b61107f565b6040516102a89190611f6d565b60405180910390f35b6102cb60048036038101906102c69190611cb5565b61110d565b6040516102de9796959493929190612035565b60405180910390f35b61030160048036038101906102fc9190611cb5565b6114d5565b6040516103159897969594939291906120b9565b60405180910390f35b6103266116e2565b6040516103339190611f6d565b60405180910390f35b6103566004803603810190610351919061214c565b611770565b005b610360611a01565b60405161036d9190611c9a565b60405180910390f35b600073ffffffffffffffffffffffffffffffffffffffff16600260008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060030160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614610447576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161043e90612283565b60405180910390fd5b600060048054905090506040518061010001604052808281526020018581526020018481526020018673ffffffffffffffffffffffffffffffffffffffff168152602001600181526020016000151581526020016103e8815260200183815250600260008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008201518160000155602082015181600101908161050591906124af565b50604082015181600201908161051b91906124af565b5060608201518160030160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506080820151816004015560a08201518160050160006101000a81548160ff02191690831515021790555060c0820151816006015560e08201518160070190816105ac91906124af565b509050506004859080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508473ffffffffffffffffffffffffffffffffffffffff16817fe11979f4244cfc0a2701344a03c0343638f175ab3c9f032cdbd24f2725e06eea8686600160006103e889604051610668969594939291906125bc565b60405180910390a35050505050565b6000600480549050905090565b60608060006060600060606000600160008973ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600101600160008a73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600201600160008b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060000154600160008c73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600301600160008d73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060040154600160008e73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600601600160008f73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060050160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1686805461088e906122d2565b80601f01602080910402602001604051908101604052809291908181526020018280546108ba906122d2565b80156109075780601f106108dc57610100808354040283529160200191610907565b820191906000526020600020905b8154815290600101906020018083116108ea57829003601f168201915b5050505050965085805461091a906122d2565b80601f0160208091040260200160405190810160405280929190818152602001828054610946906122d2565b80156109935780601f1061096857610100808354040283529160200191610993565b820191906000526020600020905b81548152906001019060200180831161097657829003601f168201915b505050505095508380546109a6906122d2565b80601f01602080910402602001604051908101604052809291908181526020018280546109d2906122d2565b8015610a1f5780601f106109f457610100808354040283529160200191610a1f565b820191906000526020600020905b815481529060010190602001808311610a0257829003601f168201915b50505050509350818054610a32906122d2565b80601f0160208091040260200160405190810160405280929190818152602001828054610a5e906122d2565b8015610aab5780601f10610a8057610100808354040283529160200191610aab565b820191906000526020600020905b815481529060010190602001808311610a8e57829003601f168201915b505050505091509650965096509650965096509650919395979092949650565b60038181548110610adb57600080fd5b906000526020600020016000915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60048181548110610b1a57600080fd5b906000526020600020016000915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000600260003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002090506000816004015403610bf7576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610bee9061267e565b60405180910390fd5b8060050160009054906101000a900460ff1615610c49576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610c40906126ea565b60405180910390fd5b60018160050160006101000a81548160ff0219169083151502179055508181600601819055506005339080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060018060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206004016000828254610d249190612739565b92505081905550505050565b60606003805480602002602001604051908101604052809291908181526020018280548015610db457602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019060010190808311610d6a575b5050505050905090565b60058181548110610dce57600080fd5b906000526020600020016000915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6001602052806000526040600020600091509050806000015490806001018054610e26906122d2565b80601f0160208091040260200160405190810160405280929190818152602001828054610e52906122d2565b8015610e9f5780601f10610e7457610100808354040283529160200191610e9f565b820191906000526020600020905b815481529060010190602001808311610e8257829003601f168201915b505050505090806002018054610eb4906122d2565b80601f0160208091040260200160405190810160405280929190818152602001828054610ee0906122d2565b8015610f2d5780601f10610f0257610100808354040283529160200191610f2d565b820191906000526020600020905b815481529060010190602001808311610f1057829003601f168201915b505050505090806003018054610f42906122d2565b80601f0160208091040260200160405190810160405280929190818152602001828054610f6e906122d2565b8015610fbb5780601f10610f9057610100808354040283529160200191610fbb565b820191906000526020600020905b815481529060010190602001808311610f9e57829003601f168201915b5050505050908060040154908060050160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690806006018054610ffc906122d2565b80601f0160208091040260200160405190810160405280929190818152602001828054611028906122d2565b80156110755780601f1061104a57610100808354040283529160200191611075565b820191906000526020600020905b81548152906001019060200180831161105857829003601f168201915b5050505050905087565b6060600580548060200260200160405190810160405280929190818152602001828054801561110357602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190600101908083116110b9575b5050505050905090565b600060608060006060600080600260008973ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060000154600260008a73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600101600260008b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600201600260008c73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060030160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16600260008d73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600701600260008e73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060040154600260008f73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060050160009054906101000a900460ff16858054611324906122d2565b80601f0160208091040260200160405190810160405280929190818152602001828054611350906122d2565b801561139d5780601f106113725761010080835404028352916020019161139d565b820191906000526020600020905b81548152906001019060200180831161138057829003601f168201915b505050505095508480546113b0906122d2565b80601f01602080910402602001604051908101604052809291908181526020018280546113dc906122d2565b80156114295780601f106113fe57610100808354040283529160200191611429565b820191906000526020600020905b81548152906001019060200180831161140c57829003601f168201915b5050505050945082805461143c906122d2565b80601f0160208091040260200160405190810160405280929190818152602001828054611468906122d2565b80156114b55780601f1061148a576101008083540402835291602001916114b5565b820191906000526020600020905b81548152906001019060200180831161149857829003601f168201915b505050505092509650965096509650965096509650919395979092949650565b60026020528060005260406000206000915090508060000154908060010180546114fe906122d2565b80601f016020809104026020016040519081016040528092919081815260200182805461152a906122d2565b80156115775780601f1061154c57610100808354040283529160200191611577565b820191906000526020600020905b81548152906001019060200180831161155a57829003601f168201915b50505050509080600201805461158c906122d2565b80601f01602080910402602001604051908101604052809291908181526020018280546115b8906122d2565b80156116055780601f106115da57610100808354040283529160200191611605565b820191906000526020600020905b8154815290600101906020018083116115e857829003601f168201915b5050505050908060030160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16908060040154908060050160009054906101000a900460ff169080600601549080600701805461165f906122d2565b80601f016020809104026020016040519081016040528092919081815260200182805461168b906122d2565b80156116d85780601f106116ad576101008083540402835291602001916116d8565b820191906000526020600020905b8154815290600101906020018083116116bb57829003601f168201915b5050505050905088565b6060600480548060200260200160405190810160405280929190818152602001828054801561176657602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001906001019080831161171c575b5050505050905090565b6000600160008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060000154146117f5576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016117ec906127b9565b60405180910390fd5b600060038054905090506040518060e00160405280828152602001868152602001858152602001848152602001600081526020018773ffffffffffffffffffffffffffffffffffffffff16815260200183815250600160008873ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000820151816000015560208201518160010190816118a791906124af565b5060408201518160020190816118bd91906124af565b5060608201518160030190816118d391906124af565b506080820151816004015560a08201518160050160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060c082015181600601908161193a91906124af565b509050506003869080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508573ffffffffffffffffffffffffffffffffffffffff16817f978d20e26392611c02bd1a6e72cc85fa19bd1024b23c12155f8183fbc90902e78787876000886040516119f1959493929190612814565b60405180910390a3505050505050565b6000600380549050905090565b6000604051905090565b600080fd5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000611a4d82611a22565b9050919050565b611a5d81611a42565b8114611a6857600080fd5b50565b600081359050611a7a81611a54565b92915050565b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b611ad382611a8a565b810181811067ffffffffffffffff82111715611af257611af1611a9b565b5b80604052505050565b6000611b05611a0e565b9050611b118282611aca565b919050565b600067ffffffffffffffff821115611b3157611b30611a9b565b5b611b3a82611a8a565b9050602081019050919050565b82818337600083830152505050565b6000611b69611b6484611b16565b611afb565b905082815260208101848484011115611b8557611b84611a85565b5b611b90848285611b47565b509392505050565b600082601f830112611bad57611bac611a80565b5b8135611bbd848260208601611b56565b91505092915050565b60008060008060808587031215611be057611bdf611a18565b5b6000611bee87828801611a6b565b945050602085013567ffffffffffffffff811115611c0f57611c0e611a1d565b5b611c1b87828801611b98565b935050604085013567ffffffffffffffff811115611c3c57611c3b611a1d565b5b611c4887828801611b98565b925050606085013567ffffffffffffffff811115611c6957611c68611a1d565b5b611c7587828801611b98565b91505092959194509250565b6000819050919050565b611c9481611c81565b82525050565b6000602082019050611caf6000830184611c8b565b92915050565b600060208284031215611ccb57611cca611a18565b5b6000611cd984828501611a6b565b91505092915050565b600081519050919050565b600082825260208201905092915050565b60005b83811015611d1c578082015181840152602081019050611d01565b60008484015250505050565b6000611d3382611ce2565b611d3d8185611ced565b9350611d4d818560208601611cfe565b611d5681611a8a565b840191505092915050565b611d6a81611a42565b82525050565b600060e0820190508181036000830152611d8a818a611d28565b90508181036020830152611d9e8189611d28565b9050611dad6040830188611c8b565b8181036060830152611dbf8187611d28565b9050611dce6080830186611c8b565b81810360a0830152611de08185611d28565b9050611def60c0830184611d61565b98975050505050505050565b611e0481611c81565b8114611e0f57600080fd5b50565b600081359050611e2181611dfb565b92915050565b600060208284031215611e3d57611e3c611a18565b5b6000611e4b84828501611e12565b91505092915050565b6000602082019050611e696000830184611d61565b92915050565b60008060408385031215611e8657611e85611a18565b5b6000611e9485828601611a6b565b9250506020611ea585828601611e12565b9150509250929050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b611ee481611a42565b82525050565b6000611ef68383611edb565b60208301905092915050565b6000602082019050919050565b6000611f1a82611eaf565b611f248185611eba565b9350611f2f83611ecb565b8060005b83811015611f60578151611f478882611eea565b9750611f5283611f02565b925050600181019050611f33565b5085935050505092915050565b60006020820190508181036000830152611f878184611f0f565b905092915050565b600060e082019050611fa4600083018a611c8b565b8181036020830152611fb68189611d28565b90508181036040830152611fca8188611d28565b90508181036060830152611fde8187611d28565b9050611fed6080830186611c8b565b611ffa60a0830185611d61565b81810360c083015261200c8184611d28565b905098975050505050505050565b60008115159050919050565b61202f8161201a565b82525050565b600060e08201905061204a600083018a611c8b565b818103602083015261205c8189611d28565b905081810360408301526120708188611d28565b905061207f6060830187611d61565b81810360808301526120918186611d28565b90506120a060a0830185611c8b565b6120ad60c0830184612026565b98975050505050505050565b6000610100820190506120cf600083018b611c8b565b81810360208301526120e1818a611d28565b905081810360408301526120f58189611d28565b90506121046060830188611d61565b6121116080830187611c8b565b61211e60a0830186612026565b61212b60c0830185611c8b565b81810360e083015261213d8184611d28565b90509998505050505050505050565b600080600080600060a0868803121561216857612167611a18565b5b600061217688828901611a6b565b955050602086013567ffffffffffffffff81111561219757612196611a1d565b5b6121a388828901611b98565b945050604086013567ffffffffffffffff8111156121c4576121c3611a1d565b5b6121d088828901611b98565b935050606086013567ffffffffffffffff8111156121f1576121f0611a1d565b5b6121fd88828901611b98565b925050608086013567ffffffffffffffff81111561221e5761221d611a1d565b5b61222a88828901611b98565b9150509295509295909350565b7f566f74657220616c726561647920726567697374657265640000000000000000600082015250565b600061226d601883611ced565b915061227882612237565b602082019050919050565b6000602082019050818103600083015261229c81612260565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806122ea57607f821691505b6020821081036122fd576122fc6122a3565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026123657fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82612328565b61236f8683612328565b95508019841693508086168417925050509392505050565b6000819050919050565b60006123ac6123a76123a284611c81565b612387565b611c81565b9050919050565b6000819050919050565b6123c683612391565b6123da6123d2826123b3565b848454612335565b825550505050565b600090565b6123ef6123e2565b6123fa8184846123bd565b505050565b5b8181101561241e576124136000826123e7565b600181019050612400565b5050565b601f8211156124635761243481612303565b61243d84612318565b8101602085101561244c578190505b61246061245885612318565b8301826123ff565b50505b505050565b600082821c905092915050565b600061248660001984600802612468565b1980831691505092915050565b600061249f8383612475565b9150826002028217905092915050565b6124b882611ce2565b67ffffffffffffffff8111156124d1576124d0611a9b565b5b6124db82546122d2565b6124e6828285612422565b600060209050601f8311600181146125195760008415612507578287015190505b6125118582612493565b865550612579565b601f19841661252786612303565b60005b8281101561254f5784890151825560018201915060208501945060208101905061252a565b8683101561256c5784890151612568601f891682612475565b8355505b6001600288020188555050505b505050505050565b6000819050919050565b60006125a66125a161259c84612581565b612387565b611c81565b9050919050565b6125b68161258b565b82525050565b600060c08201905081810360008301526125d68189611d28565b905081810360208301526125ea8188611d28565b90506125f96040830187612026565b6126066060830186612026565b61261360808301856125ad565b81810360a08301526126258184611d28565b9050979650505050505050565b7f596f752068617665206e6f20726967687420746f20766f746500000000000000600082015250565b6000612668601983611ced565b915061267382612632565b602082019050919050565b600060208201905081810360008301526126978161265b565b9050919050565b7f596f75206861766520616c726561647920766f74656400000000000000000000600082015250565b60006126d4601683611ced565b91506126df8261269e565b602082019050919050565b60006020820190508181036000830152612703816126c7565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061274482611c81565b915061274f83611c81565b92508282019050808211156127675761276661270a565b5b92915050565b7f43616e64696461746520616c7265616479206578697374730000000000000000600082015250565b60006127a3601883611ced565b91506127ae8261276d565b602082019050919050565b600060208201905081810360008301526127d281612796565b9050919050565b6000819050919050565b60006127fe6127f96127f4846127d9565b612387565b611c81565b9050919050565b61280e816127e3565b82525050565b600060a082019050818103600083015261282e8188611d28565b905081810360208301526128428187611d28565b905081810360408301526128568186611d28565b90506128656060830185612805565b81810360808301526128778184611d28565b9050969550505050505056fea2646970667358221220c1a3e3e73fe94e5e7cf8505135474a0224a7e94e4ddd4064416c85213156e38964736f6c63430008130033\",\"deployedBytecode\":\"0x608060405234801561001057600080fd5b50600436106101005760003560e01c80637831ffb311610097578063a3ec138d11610066578063a3ec138d146102e7578063b28d92ae1461031e578063c91ec7121461033c578063f7522a831461035857610100565b80637831ffb31461022d5780638ab66a901461025d5780638e945685146102935780638fb4cd80146102b157610100565b806343242daa116100d357806343242daa146101a55780635cc48aa7146101d55780635f74bbde146101f357806370218b851461020f57610100565b80630361419e1461010557806305ad45a4146101215780632a466ac71461013f5780633a88251a14610175575b600080fd5b61011f600480360381019061011a9190611bc6565b610376565b005b610129610677565b6040516101369190611c9a565b60405180910390f35b61015960048036038101906101549190611cb5565b610684565b60405161016c9796959493929190611d70565b60405180910390f35b61018f600480360381019061018a9190611e27565b610acb565b60405161019c9190611e54565b60405180910390f35b6101bf60048036038101906101ba9190611e27565b610b0a565b6040516101cc9190611e54565b60405180910390f35b6101dd610b49565b6040516101ea9190611e54565b60405180910390f35b61020d60048036038101906102089190611e6f565b610b6d565b005b610217610d30565b6040516102249190611f6d565b60405180910390f35b61024760048036038101906102429190611e27565b610dbe565b6040516102549190611e54565b60405180910390f35b61027760048036038101906102729190611cb5565b610dfd565b60405161028a9796959493929190611f8f565b60405180910390f35b61029b61107f565b6040516102a89190611f6d565b60405180910390f35b6102cb60048036038101906102c69190611cb5565b61110d565b6040516102de9796959493929190612035565b60405180910390f35b61030160048036038101906102fc9190611cb5565b6114d5565b6040516103159897969594939291906120b9565b60405180910390f35b6103266116e2565b6040516103339190611f6d565b60405180910390f35b6103566004803603810190610351919061214c565b611770565b005b610360611a01565b60405161036d9190611c9a565b60405180910390f35b600073ffffffffffffffffffffffffffffffffffffffff16600260008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060030160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614610447576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161043e90612283565b60405180910390fd5b600060048054905090506040518061010001604052808281526020018581526020018481526020018673ffffffffffffffffffffffffffffffffffffffff168152602001600181526020016000151581526020016103e8815260200183815250600260008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008201518160000155602082015181600101908161050591906124af565b50604082015181600201908161051b91906124af565b5060608201518160030160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506080820151816004015560a08201518160050160006101000a81548160ff02191690831515021790555060c0820151816006015560e08201518160070190816105ac91906124af565b509050506004859080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508473ffffffffffffffffffffffffffffffffffffffff16817fe11979f4244cfc0a2701344a03c0343638f175ab3c9f032cdbd24f2725e06eea8686600160006103e889604051610668969594939291906125bc565b60405180910390a35050505050565b6000600480549050905090565b60608060006060600060606000600160008973ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600101600160008a73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600201600160008b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060000154600160008c73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600301600160008d73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060040154600160008e73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600601600160008f73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060050160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1686805461088e906122d2565b80601f01602080910402602001604051908101604052809291908181526020018280546108ba906122d2565b80156109075780601f106108dc57610100808354040283529160200191610907565b820191906000526020600020905b8154815290600101906020018083116108ea57829003601f168201915b5050505050965085805461091a906122d2565b80601f0160208091040260200160405190810160405280929190818152602001828054610946906122d2565b80156109935780601f1061096857610100808354040283529160200191610993565b820191906000526020600020905b81548152906001019060200180831161097657829003601f168201915b505050505095508380546109a6906122d2565b80601f01602080910402602001604051908101604052809291908181526020018280546109d2906122d2565b8015610a1f5780601f106109f457610100808354040283529160200191610a1f565b820191906000526020600020905b815481529060010190602001808311610a0257829003601f168201915b50505050509350818054610a32906122d2565b80601f0160208091040260200160405190810160405280929190818152602001828054610a5e906122d2565b8015610aab5780601f10610a8057610100808354040283529160200191610aab565b820191906000526020600020905b815481529060010190602001808311610a8e57829003601f168201915b505050505091509650965096509650965096509650919395979092949650565b60038181548110610adb57600080fd5b906000526020600020016000915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60048181548110610b1a57600080fd5b906000526020600020016000915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000600260003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002090506000816004015403610bf7576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610bee9061267e565b60405180910390fd5b8060050160009054906101000a900460ff1615610c49576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610c40906126ea565b60405180910390fd5b60018160050160006101000a81548160ff0219169083151502179055508181600601819055506005339080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060018060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206004016000828254610d249190612739565b92505081905550505050565b60606003805480602002602001604051908101604052809291908181526020018280548015610db457602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019060010190808311610d6a575b5050505050905090565b60058181548110610dce57600080fd5b906000526020600020016000915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6001602052806000526040600020600091509050806000015490806001018054610e26906122d2565b80601f0160208091040260200160405190810160405280929190818152602001828054610e52906122d2565b8015610e9f5780601f10610e7457610100808354040283529160200191610e9f565b820191906000526020600020905b815481529060010190602001808311610e8257829003601f168201915b505050505090806002018054610eb4906122d2565b80601f0160208091040260200160405190810160405280929190818152602001828054610ee0906122d2565b8015610f2d5780601f10610f0257610100808354040283529160200191610f2d565b820191906000526020600020905b815481529060010190602001808311610f1057829003601f168201915b505050505090806003018054610f42906122d2565b80601f0160208091040260200160405190810160405280929190818152602001828054610f6e906122d2565b8015610fbb5780601f10610f9057610100808354040283529160200191610fbb565b820191906000526020600020905b815481529060010190602001808311610f9e57829003601f168201915b5050505050908060040154908060050160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690806006018054610ffc906122d2565b80601f0160208091040260200160405190810160405280929190818152602001828054611028906122d2565b80156110755780601f1061104a57610100808354040283529160200191611075565b820191906000526020600020905b81548152906001019060200180831161105857829003601f168201915b5050505050905087565b6060600580548060200260200160405190810160405280929190818152602001828054801561110357602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190600101908083116110b9575b5050505050905090565b600060608060006060600080600260008973ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060000154600260008a73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600101600260008b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600201600260008c73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060030160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16600260008d73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600701600260008e73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060040154600260008f73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060050160009054906101000a900460ff16858054611324906122d2565b80601f0160208091040260200160405190810160405280929190818152602001828054611350906122d2565b801561139d5780601f106113725761010080835404028352916020019161139d565b820191906000526020600020905b81548152906001019060200180831161138057829003601f168201915b505050505095508480546113b0906122d2565b80601f01602080910402602001604051908101604052809291908181526020018280546113dc906122d2565b80156114295780601f106113fe57610100808354040283529160200191611429565b820191906000526020600020905b81548152906001019060200180831161140c57829003601f168201915b5050505050945082805461143c906122d2565b80601f0160208091040260200160405190810160405280929190818152602001828054611468906122d2565b80156114b55780601f1061148a576101008083540402835291602001916114b5565b820191906000526020600020905b81548152906001019060200180831161149857829003601f168201915b505050505092509650965096509650965096509650919395979092949650565b60026020528060005260406000206000915090508060000154908060010180546114fe906122d2565b80601f016020809104026020016040519081016040528092919081815260200182805461152a906122d2565b80156115775780601f1061154c57610100808354040283529160200191611577565b820191906000526020600020905b81548152906001019060200180831161155a57829003601f168201915b50505050509080600201805461158c906122d2565b80601f01602080910402602001604051908101604052809291908181526020018280546115b8906122d2565b80156116055780601f106115da57610100808354040283529160200191611605565b820191906000526020600020905b8154815290600101906020018083116115e857829003601f168201915b5050505050908060030160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16908060040154908060050160009054906101000a900460ff169080600601549080600701805461165f906122d2565b80601f016020809104026020016040519081016040528092919081815260200182805461168b906122d2565b80156116d85780601f106116ad576101008083540402835291602001916116d8565b820191906000526020600020905b8154815290600101906020018083116116bb57829003601f168201915b5050505050905088565b6060600480548060200260200160405190810160405280929190818152602001828054801561176657602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001906001019080831161171c575b5050505050905090565b6000600160008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060000154146117f5576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016117ec906127b9565b60405180910390fd5b600060038054905090506040518060e00160405280828152602001868152602001858152602001848152602001600081526020018773ffffffffffffffffffffffffffffffffffffffff16815260200183815250600160008873ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000820151816000015560208201518160010190816118a791906124af565b5060408201518160020190816118bd91906124af565b5060608201518160030190816118d391906124af565b506080820151816004015560a08201518160050160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060c082015181600601908161193a91906124af565b509050506003869080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508573ffffffffffffffffffffffffffffffffffffffff16817f978d20e26392611c02bd1a6e72cc85fa19bd1024b23c12155f8183fbc90902e78787876000886040516119f1959493929190612814565b60405180910390a3505050505050565b6000600380549050905090565b6000604051905090565b600080fd5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000611a4d82611a22565b9050919050565b611a5d81611a42565b8114611a6857600080fd5b50565b600081359050611a7a81611a54565b92915050565b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b611ad382611a8a565b810181811067ffffffffffffffff82111715611af257611af1611a9b565b5b80604052505050565b6000611b05611a0e565b9050611b118282611aca565b919050565b600067ffffffffffffffff821115611b3157611b30611a9b565b5b611b3a82611a8a565b9050602081019050919050565b82818337600083830152505050565b6000611b69611b6484611b16565b611afb565b905082815260208101848484011115611b8557611b84611a85565b5b611b90848285611b47565b509392505050565b600082601f830112611bad57611bac611a80565b5b8135611bbd848260208601611b56565b91505092915050565b60008060008060808587031215611be057611bdf611a18565b5b6000611bee87828801611a6b565b945050602085013567ffffffffffffffff811115611c0f57611c0e611a1d565b5b611c1b87828801611b98565b935050604085013567ffffffffffffffff811115611c3c57611c3b611a1d565b5b611c4887828801611b98565b925050606085013567ffffffffffffffff811115611c6957611c68611a1d565b5b611c7587828801611b98565b91505092959194509250565b6000819050919050565b611c9481611c81565b82525050565b6000602082019050611caf6000830184611c8b565b92915050565b600060208284031215611ccb57611cca611a18565b5b6000611cd984828501611a6b565b91505092915050565b600081519050919050565b600082825260208201905092915050565b60005b83811015611d1c578082015181840152602081019050611d01565b60008484015250505050565b6000611d3382611ce2565b611d3d8185611ced565b9350611d4d818560208601611cfe565b611d5681611a8a565b840191505092915050565b611d6a81611a42565b82525050565b600060e0820190508181036000830152611d8a818a611d28565b90508181036020830152611d9e8189611d28565b9050611dad6040830188611c8b565b8181036060830152611dbf8187611d28565b9050611dce6080830186611c8b565b81810360a0830152611de08185611d28565b9050611def60c0830184611d61565b98975050505050505050565b611e0481611c81565b8114611e0f57600080fd5b50565b600081359050611e2181611dfb565b92915050565b600060208284031215611e3d57611e3c611a18565b5b6000611e4b84828501611e12565b91505092915050565b6000602082019050611e696000830184611d61565b92915050565b60008060408385031215611e8657611e85611a18565b5b6000611e9485828601611a6b565b9250506020611ea585828601611e12565b9150509250929050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b611ee481611a42565b82525050565b6000611ef68383611edb565b60208301905092915050565b6000602082019050919050565b6000611f1a82611eaf565b611f248185611eba565b9350611f2f83611ecb565b8060005b83811015611f60578151611f478882611eea565b9750611f5283611f02565b925050600181019050611f33565b5085935050505092915050565b60006020820190508181036000830152611f878184611f0f565b905092915050565b600060e082019050611fa4600083018a611c8b565b8181036020830152611fb68189611d28565b90508181036040830152611fca8188611d28565b90508181036060830152611fde8187611d28565b9050611fed6080830186611c8b565b611ffa60a0830185611d61565b81810360c083015261200c8184611d28565b905098975050505050505050565b60008115159050919050565b61202f8161201a565b82525050565b600060e08201905061204a600083018a611c8b565b818103602083015261205c8189611d28565b905081810360408301526120708188611d28565b905061207f6060830187611d61565b81810360808301526120918186611d28565b90506120a060a0830185611c8b565b6120ad60c0830184612026565b98975050505050505050565b6000610100820190506120cf600083018b611c8b565b81810360208301526120e1818a611d28565b905081810360408301526120f58189611d28565b90506121046060830188611d61565b6121116080830187611c8b565b61211e60a0830186612026565b61212b60c0830185611c8b565b81810360e083015261213d8184611d28565b90509998505050505050505050565b600080600080600060a0868803121561216857612167611a18565b5b600061217688828901611a6b565b955050602086013567ffffffffffffffff81111561219757612196611a1d565b5b6121a388828901611b98565b945050604086013567ffffffffffffffff8111156121c4576121c3611a1d565b5b6121d088828901611b98565b935050606086013567ffffffffffffffff8111156121f1576121f0611a1d565b5b6121fd88828901611b98565b925050608086013567ffffffffffffffff81111561221e5761221d611a1d565b5b61222a88828901611b98565b9150509295509295909350565b7f566f74657220616c726561647920726567697374657265640000000000000000600082015250565b600061226d601883611ced565b915061227882612237565b602082019050919050565b6000602082019050818103600083015261229c81612260565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806122ea57607f821691505b6020821081036122fd576122fc6122a3565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026123657fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82612328565b61236f8683612328565b95508019841693508086168417925050509392505050565b6000819050919050565b60006123ac6123a76123a284611c81565b612387565b611c81565b9050919050565b6000819050919050565b6123c683612391565b6123da6123d2826123b3565b848454612335565b825550505050565b600090565b6123ef6123e2565b6123fa8184846123bd565b505050565b5b8181101561241e576124136000826123e7565b600181019050612400565b5050565b601f8211156124635761243481612303565b61243d84612318565b8101602085101561244c578190505b61246061245885612318565b8301826123ff565b50505b505050565b600082821c905092915050565b600061248660001984600802612468565b1980831691505092915050565b600061249f8383612475565b9150826002028217905092915050565b6124b882611ce2565b67ffffffffffffffff8111156124d1576124d0611a9b565b5b6124db82546122d2565b6124e6828285612422565b600060209050601f8311600181146125195760008415612507578287015190505b6125118582612493565b865550612579565b601f19841661252786612303565b60005b8281101561254f5784890151825560018201915060208501945060208101905061252a565b8683101561256c5784890151612568601f891682612475565b8355505b6001600288020188555050505b505050505050565b6000819050919050565b60006125a66125a161259c84612581565b612387565b611c81565b9050919050565b6125b68161258b565b82525050565b600060c08201905081810360008301526125d68189611d28565b905081810360208301526125ea8188611d28565b90506125f96040830187612026565b6126066060830186612026565b61261360808301856125ad565b81810360a08301526126258184611d28565b9050979650505050505050565b7f596f752068617665206e6f20726967687420746f20766f746500000000000000600082015250565b6000612668601983611ced565b915061267382612632565b602082019050919050565b600060208201905081810360008301526126978161265b565b9050919050565b7f596f75206861766520616c726561647920766f74656400000000000000000000600082015250565b60006126d4601683611ced565b91506126df8261269e565b602082019050919050565b60006020820190508181036000830152612703816126c7565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061274482611c81565b915061274f83611c81565b92508282019050808211156127675761276661270a565b5b92915050565b7f43616e64696461746520616c7265616479206578697374730000000000000000600082015250565b60006127a3601883611ced565b91506127ae8261276d565b602082019050919050565b600060208201905081810360008301526127d281612796565b9050919050565b6000819050919050565b60006127fe6127f96127f4846127d9565b612387565b611c81565b9050919050565b61280e816127e3565b82525050565b600060a082019050818103600083015261282e8188611d28565b905081810360208301526128428187611d28565b905081810360408301526128568186611d28565b90506128656060830185612805565b81810360808301526128778184611d28565b9050969550505050505056fea2646970667358221220c1a3e3e73fe94e5e7cf8505135474a0224a7e94e4ddd4064416c85213156e38964736f6c63430008130033\",\"linkReferences\":{},\"deployedLinkReferences\":{}}"));}),
"[project]/context/constants.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "VotingAddress",
    ()=>VotingAddress,
    "VotingAddressABI",
    ()=>VotingAddressABI
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$artifacts$2f$contracts$2f$Voting$2e$sol$2f$Voting$2e$json__$28$json$29$__ = __turbopack_context__.i("[project]/artifacts/contracts/Voting.sol/Voting.json (json)");
;
const VotingAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Permissive Contract Address
const VotingAddressABI = __TURBOPACK__imported__module__$5b$project$5d2f$artifacts$2f$contracts$2f$Voting$2e$sol$2f$Voting$2e$json__$28$json$29$__["default"].abi;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/context/Voter.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "VotingContext",
    ()=>VotingContext,
    "VotingProvider",
    ()=>VotingProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$web3modal$2f$dist$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/web3modal/dist/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__ = __turbopack_context__.i("[project]/node_modules/ethers/lib.esm/ethers.js [client] (ecmascript) <export * as ethers>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [client] (ecmascript)");
// INTERNAL IMPORT
var __TURBOPACK__imported__module__$5b$project$5d2f$context$2f$constants$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/context/constants.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
const fetchContract = (signerOrProvider)=>{
    console.log("DEBUG: fetchContract using address:", __TURBOPACK__imported__module__$5b$project$5d2f$context$2f$constants$2e$js__$5b$client$5d$__$28$ecmascript$29$__["VotingAddress"]);
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].Contract(__TURBOPACK__imported__module__$5b$project$5d2f$context$2f$constants$2e$js__$5b$client$5d$__$28$ecmascript$29$__["VotingAddress"], __TURBOPACK__imported__module__$5b$project$5d2f$context$2f$constants$2e$js__$5b$client$5d$__$28$ecmascript$29$__["VotingAddressABI"], signerOrProvider);
};
const VotingContext = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].createContext();
const VotingProvider = ({ children })=>{
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [currentAccount, setCurrentAccount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [candidateLength, setCandidateLength] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [pushCandidate, setPushCandidate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [candidateIndex, setCandidateIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [candidateArray, setCandidateArray] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [voterArray, setVoterArray] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [voterLength, setVoterLength] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [voterAddress, setVoterAddress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    // CONNECTING METAMASK
    const checkIfWalletIsConnected = async ()=>{
        if (!window.ethereum) return setError('Please Install MetaMask');
        const account = await window.ethereum.request({
            method: 'eth_accounts'
        });
        if (account.length) {
            setCurrentAccount(account[0]);
        } else {
            setError('Please Install MetaMask & Connect, Reload');
        }
    };
    const connectWallet = async ()=>{
        if (!window.ethereum) {
            window.open("https://metamask.io/download/", "_blank");
            return setError('Please Install MetaMask');
        }
        setError('');
        try {
            const account = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            setCurrentAccount(account[0]);
            setError('');
        } catch (err) {
            console.log("Error connecting wallet:", err);
            if (err.code === 4001) {
                setError('User rejected the connection request.');
            } else {
                setError('Error connecting wallet. Please try again.');
            }
        }
    };
    // PINATA IPFS KEYS
    const pinataApiKey = '3c3a34c536225711a678';
    const pinataSecretApiKey = '598180b64a578024c85fa13b8b45dee67cfa9341efceb25ba336c44a4ef32ef4';
    // UPLOAD TO IPFS VOTE IMAGE
    const uploadToIPFS = async (file)=>{
        if (!file) return;
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"])({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
                data: formData,
                headers: {
                    pinata_api_key: pinataApiKey,
                    pinata_secret_api_key: pinataSecretApiKey,
                    "Content-Type": "multipart/form-data"
                }
            });
            const url = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
            return url;
        } catch (error) {
            console.log('Error uploading content to IPFS', error);
            setError(`Error uploading IPFS: ${error.message}`);
        }
    };
    // UPLOAD TO IPFS CANDIDATE IMAGE
    const uploadToIPFSCandidate = async (file)=>{
        if (!file) return;
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"])({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
                data: formData,
                headers: {
                    pinata_api_key: pinataApiKey,
                    pinata_secret_api_key: pinataSecretApiKey,
                    "Content-Type": "multipart/form-data"
                }
            });
            const url = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
            return url;
        } catch (error) {
            console.log('Error uploading content to IPFS', error);
            setError(`Error uploading IPFS: ${error.message}`);
        }
    };
    // CREATE VOTER
    const createVoter = async (formInput, fileUrl)=>{
        const { name, address, position } = formInput;
        if (!name || !address || !position) return setError('Input data is missing');
        const web3Modal = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$web3modal$2f$dist$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"]();
        const connection = await web3Modal.connect();
        const provider = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].providers.Web3Provider(connection);
        const signer = provider.getSigner();
        const contract = fetchContract(signer);
        const data = JSON.stringify({
            name,
            address,
            position,
            image: fileUrl
        });
        try {
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"])({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                data: data,
                headers: {
                    pinata_api_key: pinataApiKey,
                    pinata_secret_api_key: pinataSecretApiKey,
                    "Content-Type": "application/json"
                }
            });
            const url = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
            const voter = await contract.voterRight(address.trim(), name, fileUrl, url);
            await voter.wait();
            router.push('/voterList');
        } catch (error) {
            setError(`Error creating voter: ${error.message}`);
        }
    };
    // GET VOTER DATA
    const getAllVoterData = async ()=>{
        try {
            const web3Modal = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$web3modal$2f$dist$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"]();
            const connection = await web3Modal.connect();
            const provider = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].providers.Web3Provider(connection);
            const signer = provider.getSigner();
            const contract = fetchContract(signer);
            // VOTER LIST
            const voterListData = await contract.getVoterList();
            setVoterAddress(voterListData);
            const items = await Promise.all(voterListData.map(async (el)=>{
                const singleVoterData = await contract.getVoterData(el);
                // 0: id, 1: name, 2: image, 3: address, 4: ipfs, 5: allowed, 6: voted
                return {
                    id: singleVoterData[0].toNumber(),
                    name: singleVoterData[1],
                    image: singleVoterData[2],
                    address: singleVoterData[3],
                    ipfs: singleVoterData[4],
                    allowed: singleVoterData[5].toNumber(),
                    voted: singleVoterData[6]
                };
            }));
            setVoterArray(items);
        } catch (error) {
        // console.log(error); // Quiet fail if not connected
        }
    };
    // GIVE VOTE
    const giveVote = async (id)=>{
        try {
            const voterAddress = id.address;
            const voterId = id.id;
            const web3Modal = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$web3modal$2f$dist$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"]();
            const connection = await web3Modal.connect();
            const provider = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].providers.Web3Provider(connection);
            const signer = provider.getSigner();
            const contract = fetchContract(signer);
            const voted = await contract.vote(voterAddress, voterId);
            await voted.wait();
            router.push('/voted');
        } catch (error) {
            console.log(error);
            setError('Error in voting');
        }
    };
    // CANDIDATE SECTION
    const setCandidate = async (candidateForm, fileUrl, router)=>{
        const { name, address, age } = candidateForm;
        if (!name || !address || !age) return setError('Input data is missing');
        const web3Modal = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$web3modal$2f$dist$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"]();
        const connection = await web3Modal.connect();
        const provider = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].providers.Web3Provider(connection);
        const signer = provider.getSigner();
        const contract = fetchContract(signer);
        const data = JSON.stringify({
            name,
            address,
            age,
            image: fileUrl
        });
        try {
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"])({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                data: data,
                headers: {
                    pinata_api_key: pinataApiKey,
                    pinata_secret_api_key: pinataSecretApiKey,
                    "Content-Type": "application/json"
                }
            });
            const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
            const candidate = await contract.setCandidate(address.trim(), age, name, fileUrl, ipfsUrl);
            await candidate.wait();
            router.push('/');
        } catch (error) {
            setError(`Error creating candidate: ${error.message}`);
        }
    };
    const getNewCandidate = async ()=>{
        try {
            const web3Modal = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$web3modal$2f$dist$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"]();
            const connection = await web3Modal.connect();
            const provider = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].providers.Web3Provider(connection);
            const signer = provider.getSigner();
            const contract = fetchContract(signer);
            const allCandidate = await contract.getCandidate();
            const allCandidateData = await Promise.all(allCandidate.map(async (el)=>{
                const singleCandidate = await contract.getCandidateData(el);
                return {
                    age: singleCandidate[0],
                    name: singleCandidate[1],
                    candidateID: singleCandidate[2].toNumber(),
                    image: singleCandidate[3],
                    voteCount: singleCandidate[4].toNumber(),
                    ipfs: singleCandidate[5],
                    address: singleCandidate[6]
                };
            }));
            setCandidateArray(allCandidateData);
            setCandidateLength(allCandidate.length);
        } catch (error) {
        // console.log(error);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(VotingContext.Provider, {
        value: {
            currentAccount,
            connectWallet,
            uploadToIPFS,
            createVoter,
            voterArray,
            getAllVoterData,
            giveVote,
            setCandidate,
            getNewCandidate,
            candidateArray,
            checkIfWalletIsConnected,
            candidateLength,
            error,
            voterLength,
            voterAddress,
            uploadToIPFSCandidate
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/context/Voter.js",
        lineNumber: 287,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(VotingProvider, "X5x9KpQWfhtSRurvQKeBGuVe4uU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = VotingProvider;
var _c;
__turbopack_context__.k.register(_c, "VotingProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/Button.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
;
const Button = ({ btnName, handleClick, classStyles })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        className: `bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-primary/50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${classStyles}`,
        onClick: handleClick,
        children: btnName
    }, void 0, false, {
        fileName: "[project]/components/Button.js",
        lineNumber: 3,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
_c = Button;
const __TURBOPACK__default__export__ = Button;
var _c;
__turbopack_context__.k.register(_c, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/Input.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
;
;
const Input = ({ inputType, title, placeholder, handleClick })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full mb-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "text-gray-400 font-medium mb-2 block text-sm uppercase tracking-wide",
                children: title
            }, void 0, false, {
                fileName: "[project]/components/Input.js",
                lineNumber: 7,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: inputType,
                className: "w-full bg-paper border border-gray-700 text-text rounded-lg p-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 placeholder-gray-600",
                placeholder: placeholder,
                onChange: handleClick
            }, void 0, false, {
                fileName: "[project]/components/Input.js",
                lineNumber: 8,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/components/Input.js",
        lineNumber: 6,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_c = Input;
const __TURBOPACK__default__export__ = Input;
var _c;
__turbopack_context__.k.register(_c, "Input");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/pages/allowed-voters.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$dropzone$2f$dist$2f$es$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/react-dropzone/dist/es/index.js [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [client] (ecmascript)");
// INTERNAL IMPORT
var __TURBOPACK__imported__module__$5b$project$5d2f$context$2f$Voter$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/context/Voter.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Button$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Button.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Input$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Input.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
const AllowedVoters = ()=>{
    _s();
    const [fileUrl, setFileUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [formInput, setFormInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        name: '',
        address: '',
        position: ''
    });
    const { uploadToIPFS, createVoter } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$context$2f$Voter$2e$js__$5b$client$5d$__$28$ecmascript$29$__["VotingContext"]);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    // DROPZONE
    const onDrop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AllowedVoters.useCallback[onDrop]": async (acceptedFile)=>{
            const url = await uploadToIPFS(acceptedFile[0]);
            setFileUrl(url);
        }
    }["AllowedVoters.useCallback[onDrop]"], []);
    const { getRootProps, getInputProps } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$dropzone$2f$dist$2f$es$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useDropzone"])({
        onDrop,
        accept: {
            'image/*': []
        },
        maxSize: 5000000
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-background flex items-center justify-center p-8",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-paper p-10 rounded-3xl shadow-2xl border border-gray-800 w-full max-w-4xl flex flex-col md:flex-row gap-12",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 flex flex-col items-center justify-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-2xl font-bold mb-6 text-white text-center",
                            children: "Voter Photo"
                        }, void 0, false, {
                            fileName: "[project]/pages/allowed-voters.js",
                            lineNumber: 41,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            ...getRootProps(),
                            className: "w-full aspect-square bg-gray-900 rounded-2xl border-2 border-dashed border-gray-700 hover:border-primary transition-all flex items-center justify-center cursor-pointer relative overflow-hidden group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    ...getInputProps()
                                }, void 0, false, {
                                    fileName: "[project]/pages/allowed-voters.js",
                                    lineNumber: 43,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                fileUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                    src: fileUrl,
                                    alt: "Voter",
                                    className: "w-full h-full object-cover"
                                }, void 0, false, {
                                    fileName: "[project]/pages/allowed-voters.js",
                                    lineNumber: 45,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-center p-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-gray-400 mb-2 group-hover:text-primary transition-colors",
                                            children: "Drag & Drop Image"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/allowed-voters.js",
                                            lineNumber: 48,
                                            columnNumber: 33
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-gray-600",
                                            children: "or click to upload"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/allowed-voters.js",
                                            lineNumber: 49,
                                            columnNumber: 33
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/allowed-voters.js",
                                    lineNumber: 47,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/allowed-voters.js",
                            lineNumber: 42,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/allowed-voters.js",
                    lineNumber: 40,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-4xl font-bold mb-2 text-white",
                            children: "Register Voter"
                        }, void 0, false, {
                            fileName: "[project]/pages/allowed-voters.js",
                            lineNumber: 57,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-400 mb-8",
                            children: "Authorize a new voter to participate in the election."
                        }, void 0, false, {
                            fileName: "[project]/pages/allowed-voters.js",
                            lineNumber: 58,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Input$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                            inputType: "text",
                            title: "Name",
                            placeholder: "Voter Name",
                            handleClick: (e)=>setFormInput({
                                    ...formInput,
                                    name: e.target.value
                                })
                        }, void 0, false, {
                            fileName: "[project]/pages/allowed-voters.js",
                            lineNumber: 60,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Input$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                            inputType: "text",
                            title: "Address",
                            placeholder: "Wallet Address",
                            handleClick: (e)=>setFormInput({
                                    ...formInput,
                                    address: e.target.value
                                })
                        }, void 0, false, {
                            fileName: "[project]/pages/allowed-voters.js",
                            lineNumber: 66,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Input$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                            inputType: "text",
                            title: "Position",
                            placeholder: "Position / Role",
                            handleClick: (e)=>setFormInput({
                                    ...formInput,
                                    position: e.target.value
                                })
                        }, void 0, false, {
                            fileName: "[project]/pages/allowed-voters.js",
                            lineNumber: 72,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-8",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Button$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                btnName: "Authorize Voter",
                                handleClick: ()=>createVoter(formInput, fileUrl),
                                classStyles: "w-full"
                            }, void 0, false, {
                                fileName: "[project]/pages/allowed-voters.js",
                                lineNumber: 80,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/pages/allowed-voters.js",
                            lineNumber: 79,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/allowed-voters.js",
                    lineNumber: 56,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/pages/allowed-voters.js",
            lineNumber: 37,
            columnNumber: 13
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/pages/allowed-voters.js",
        lineNumber: 36,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(AllowedVoters, "0ROGqG8rt4BlrtKIcrxsBoUlY7A=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$dropzone$2f$dist$2f$es$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useDropzone"]
    ];
});
_c = AllowedVoters;
const __TURBOPACK__default__export__ = AllowedVoters;
var _c;
__turbopack_context__.k.register(_c, "AllowedVoters");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/pages/allowed-voters.js [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/allowed-voters";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/pages/allowed-voters.js [client] (ecmascript)");
    }
]);
// @ts-expect-error module.hot exists
if (module.hot) {
    // @ts-expect-error module.hot exists
    module.hot.dispose(function() {
        window.__NEXT_P.push([
            PAGE_PATH
        ]);
    });
}
}),
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/pages/allowed-voters\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/pages/allowed-voters.js [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__e05b72ef._.js.map