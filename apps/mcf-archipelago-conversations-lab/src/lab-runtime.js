export function stableBrowserId(storage, cryptoObject = globalThis.crypto) {
  const key = 'mcf-archipelago-device-id';
  let id = storage.getItem(key);
  if (id) return id;

  const randomPart = typeof cryptoObject?.randomUUID === 'function'
    ? cryptoObject.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  id = 'browser-' + randomPart;
  storage.setItem(key, id);
  return id;
}

export function canCompose(node, providers, chatBusy = false) {
  if (!node || node.type !== 'chat' || chatBusy) return false;
  const openaiReady = providers?.openai?.configured === true;
  const browserReady = providers?.chatgptBrowser?.configured === true;
  return openaiReady || (browserReady && node.connectionState === 'READY');
}
export function mergeBackendChats(state, chats = []) {
  const projects = state.nodes.filter(node => node.type === 'project');
  const singleProject = projects.length === 1 ? projects[0] : null;

  for (const chat of chats) {
    if (!chat?.id) continue;
    let node = state.nodes.find(item => item.id === chat.id);
    const openaiId = chat.metadata?.openai?.conversationId || null;
    if (node) {
      if (node.type === 'chat' && openaiId) {
        node.openaiConversationId = openaiId;
        node.connectionState = 'READY';
      }
      continue;
    }

    const matchingProject = projects.find(project => project.id === chat.projectId) || singleProject;
    const index = state.nodes.filter(item => item.type === 'chat').length;
    node = {
      id:String(chat.id), type:'chat', title:String(chat.title || 'Chat persistido').slice(0,80),
      parentId: matchingProject?.id || null, tags:['backend'], messages:[],
      x:(matchingProject?.x ?? 260) + 170 + (index % 3) * 85,
      y:(matchingProject?.y ?? 180) - 120 + (index % 4) * 85,
      r:58, collapsed:false, connectionState: openaiId ? 'READY' : 'OFFLINE',
      deviceSessionId:null, openaiConversationId:openaiId, createdAt:chat.createdAt || new Date().toISOString()
    };
    state.nodes.push(node);
    if (matchingProject && !state.edges.some(edge => edge.source === matchingProject.id && edge.target === node.id)) {
      state.edges.push({ id:`backend-${node.id}`, source:matchingProject.id, target:node.id, kind:'contains', reason:'chat persistido no backend' });
    }
  }
  return state;
}

export function removePendingAssistant(node, assistant) {
  if (!node || !Array.isArray(node.messages)) return node;
  const index = node.messages.indexOf(assistant);
  if (index >= 0 && assistant?.role === 'assistant' && assistant?.status === 'streaming') {
    node.messages.splice(index, 1);
  }
  return node;
}
