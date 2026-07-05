// PromptVault Dashboard Script

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const promptsGrid = document.getElementById('dashboard-prompts-grid');
  const searchInput = document.getElementById('dashboard-search');
  const sortSelect = document.getElementById('sort-select');
  const sidebarTags = document.getElementById('sidebar-tags');
  const navAll = document.getElementById('nav-all');
  
  // Stats Elements
  const statTotalPrompts = document.getElementById('stat-total-prompts');
  const statTotalTags = document.getElementById('stat-total-tags');

  // Filter Row Elements
  const filterIndicatorRow = document.getElementById('filter-indicator-row');
  const activeFilterName = document.getElementById('active-filter-name');
  const btnClearTagFilter = document.getElementById('btn-clear-tag-filter');

  // Drawer Elements
  const editorDrawer = document.getElementById('editor-drawer');
  const drawerTitle = document.getElementById('drawer-title');
  const editorForm = document.getElementById('editor-form');
  const btnAddPrompt = document.getElementById('btn-add-prompt');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const btnCancelEditor = document.getElementById('btn-cancel-editor');
  const drawerBackdrop = document.getElementById('drawer-backdrop');

  // Form Fields
  const fieldId = document.getElementById('field-id');
  const fieldTitle = document.getElementById('field-title');
  const fieldDescription = document.getElementById('field-description');
  const fieldTags = document.getElementById('field-tags');
  const fieldContent = document.getElementById('field-content');
  const promptPreview = document.getElementById('prompt-preview');
  const charCount = document.getElementById('char-count');
  const wordCount = document.getElementById('word-count');

  // Backup Elements
  const btnExport = document.getElementById('btn-export');
  const btnImportTrigger = document.getElementById('btn-import-trigger');
  const fileImport = document.getElementById('file-import');

  // Toast System
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  // Variable Overlay Elements
  const variableOverlay = document.getElementById('variable-overlay');
  const variableForm = document.getElementById('variable-form');
  const variablesInputsContainer = document.getElementById('variables-inputs-container');
  const btnCancelVariables = document.getElementById('btn-cancel-variables');

  // State Variables
  let allPrompts = [];
  let activeTag = null;
  let activeSearch = '';
  let activeSort = 'recent';
  let currentPromptForVariables = null;

  // Load and Initialize Data
  async function loadData() {
    try {
      allPrompts = await PromptStorage.getPrompts();
      updateStats();
      renderTags();
      renderPrompts();
      
      // Check query parameters (e.g. ?action=new from popup)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('action') === 'new') {
        openDrawer();
        // Clear param so it doesn't reopen on manual page refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.error('Error fetching prompts:', e);
      showToast('Erro ao carregar os prompts.', true);
    }
  }

  // Update Top Stats Panel
  function updateStats() {
    statTotalPrompts.textContent = allPrompts.length;
    
    const uniqueTags = new Set();
    allPrompts.forEach(p => {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach(t => {
          if (t.trim()) uniqueTags.add(t.trim());
        });
      }
    });
    statTotalTags.textContent = uniqueTags.size;
  }

  // Render Tags in the Sidebar
  function renderTags() {
    const tagCounts = {};
    allPrompts.forEach(p => {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach(t => {
          const tag = t.trim();
          if (tag) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        });
      }
    });

    const sortedTags = Object.keys(tagCounts).sort();
    
    if (sortedTags.length === 0) {
      sidebarTags.innerHTML = '<div style="font-size: 11px; padding: 10px 12px; color: var(--text-muted); font-style: italic;">Nenhuma tag criada</div>';
      return;
    }

    sidebarTags.innerHTML = sortedTags.map(tag => `
      <button class="tag-nav-item ${activeTag === tag ? 'active' : ''}" data-tag="${tag}">
        <span># ${escapeHTML(tag)}</span>
        <span class="tag-count">${tagCounts[tag]}</span>
      </button>
    `).join('');

    // Attach Click Events to Sidebar Tags
    document.querySelectorAll('.tag-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const clickedTag = e.target.closest('.tag-nav-item').dataset.tag;
        setActiveTag(clickedTag);
      });
    });
  }

  // Set Active Tag and Update Filters
  function setActiveTag(tag) {
    activeTag = tag;
    
    // Manage active states visually
    document.querySelectorAll('.tag-nav-item').forEach(item => {
      if (item.dataset.tag === tag) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    if (tag) {
      navAll.classList.remove('active');
      filterIndicatorRow.style.display = 'flex';
      activeFilterName.textContent = `# ${tag}`;
    } else {
      navAll.classList.add('active');
      filterIndicatorRow.style.display = 'none';
    }

    renderPrompts();
  }

  // Clear Tag Filter Click Handler
  btnClearTagFilter.addEventListener('click', () => {
    setActiveTag(null);
  });

  navAll.addEventListener('click', () => {
    setActiveTag(null);
  });

  // Render Prompts Grid
  function renderPrompts() {
    // 1. Filter Prompts
    let filtered = allPrompts.filter(p => {
      // Filter by Tag
      const matchesTag = !activeTag || (p.tags && p.tags.includes(activeTag));
      
      // Filter by Search
      const searchLower = activeSearch.toLowerCase();
      const matchesSearch = !activeSearch || 
        p.title.toLowerCase().includes(searchLower) ||
        p.content.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(searchLower)));

      return matchesTag && matchesSearch;
    });

    // 2. Sort Prompts
    filtered.sort((a, b) => {
      if (activeSort === 'recent') {
        return (b.created || 0) - (a.created || 0);
      }
      if (activeSort === 'oldest') {
        return (a.created || 0) - (b.created || 0);
      }
      if (activeSort === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      if (activeSort === 'lastused') {
        return (b.lastUsed || 0) - (a.lastUsed || 0);
      }
      return 0;
    });

    // 3. Check for Empty State
    if (filtered.length === 0) {
      promptsGrid.innerHTML = `
        <div class="dashboard-empty">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <h3>Nenhum prompt encontrado</h3>
          <p>${activeSearch || activeTag ? 'Nenhum resultado corresponde aos filtros aplicados.' : 'Comece criando o seu primeiro prompt clicando no botão acima!'}</p>
        </div>
      `;
      return;
    }

    // 4. Generate Cards HTML
    promptsGrid.innerHTML = filtered.map(p => {
      const vars = extractVariables(p.content);
      const tagsHtml = p.tags && Array.isArray(p.tags) 
        ? p.tags.map(t => `<span class="card-tag">${escapeHTML(t)}</span>`).join('') 
        : '';
        
      const varsBadge = vars.length > 0
        ? `<span class="prompt-vars-badge" style="font-size:10px; font-weight:600; color:#a855f7;">
            { } ${vars.length} variáveis
           </span>`
        : '';

      return `
        <div class="prompt-card" data-id="${p.id}">
          <div class="card-header-row">
            <h3 class="card-title">${escapeHTML(p.title)}</h3>
            ${varsBadge}
          </div>
          <p class="card-description">${escapeHTML(p.description || 'Sem descrição fornecida.')}</p>
          <div class="card-body">${escapeHTML(p.content)}</div>
          <div class="card-footer">
            <div class="card-tags">
              ${tagsHtml}
            </div>
            <div class="card-action-bar">
              <button class="btn-icon-action btn-copy" data-id="${p.id}" title="Copiar prompt completo">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <button class="btn-icon-action btn-edit" data-id="${p.id}" title="Editar prompt">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="btn-icon-action btn-delete" data-id="${p.id}" title="Excluir prompt">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach Action Events
    document.querySelectorAll('.btn-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handlePromptCopy(btn.dataset.id);
      });
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDrawer(btn.dataset.id);
      });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handlePromptDelete(btn.dataset.id);
      });
    });
  }

  // Handle Quick Copy
  function handlePromptCopy(id) {
    const prompt = allPrompts.find(p => p.id === id);
    if (!prompt) return;

    // Check if it has variables
    const vars = extractVariables(prompt.content);
    if (vars.length > 0) {
      openVariableOverlay(prompt, vars);
    } else {
      copyToClipboard(prompt.content, 'Prompt copiado com sucesso!', prompt.id);
    }
  }

  // Copy helper
  function copyToClipboard(text, successMsg, promptId = null) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg);
      if (promptId) {
        PromptStorage.updateLastUsed(promptId).then(() => {
          const idx = allPrompts.findIndex(p => p.id === promptId);
          if (idx !== -1) {
            allPrompts[idx].lastUsed = Date.now();
            if (activeSort === 'lastused') {
              renderPrompts();
            }
          }
        });
      }
    }).catch(e => {
      console.error('Copy failure:', e);
      showToast('Erro ao copiar prompt.', true);
    });
  }

  // Open Variable Overlay with safety checks
  function openVariableOverlay(prompt, variables) {
    if (!prompt || !variables || !Array.isArray(variables)) {
      console.error('Invalid prompt or variables for overlay');
      return;
    }
    
    currentPromptForVariables = prompt;
    variablesInputsContainer.innerHTML = '';

    variables.forEach(variable => {
      const fieldDiv = document.createElement('div');
      fieldDiv.className = 'input-field';
      
      const label = document.createElement('label');
      label.setAttribute('for', `var-${variable}`);
      label.textContent = variable;

      let input;
      const lowerVar = variable.toLowerCase();
      if (lowerVar.includes('codigo') || lowerVar.includes('texto') || lowerVar.includes('corpo') || lowerVar.includes('prompt') || lowerVar.includes('content') || lowerVar.includes('code')) {
        input = document.createElement('textarea');
        input.rows = 3;
      } else {
        input = document.createElement('input');
        input.type = 'text';
      }
      
      input.id = `var-${variable}`;
      input.name = variable;
      input.required = true;
      input.placeholder = `Insira o valor para ${variable}...`;

      fieldDiv.appendChild(label);
      fieldDiv.appendChild(input);
      variablesInputsContainer.appendChild(fieldDiv);
    });

    variableOverlay.classList.add('active');
    
    setTimeout(() => {
      const firstInput = variablesInputsContainer.querySelector('input, textarea');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  // Close Variable Overlay
  function closeVariableOverlay() {
    variableOverlay.classList.remove('active');
    currentPromptForVariables = null;
    variableForm.reset();
  }

  // Variable Overlay Event Listeners
  // Variable Overlay Event Listeners with validation
  variableForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentPromptForVariables) {
      console.error('No prompt selected for variable substitution');
      return;
    }

    let finalPromptContent = currentPromptForVariables.content;
    const formData = new FormData(variableForm);
    const filledValues = {};

    formData.forEach((value, key) => {
      filledValues[key] = value;
      const escapedKey = key.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
      const regex = new RegExp(`\\\\{\\\\{\\\\s*${escapedKey}\\\\s*\\\\}\\\\}`, 'g');
      finalPromptContent = finalPromptContent.replace(regex, value);
    });

    // Validate that all variables were filled
    const emptyVars = Object.entries(filledValues).filter(([_, value]) => !value.trim());
    if (emptyVars.length > 0) {
      alert(`Por favor, preencha todos os campos: ${emptyVars.map(([k]) => k).join(', ')}`);
      return;
    }

    copyToClipboard(finalPromptContent, 'Prompt preenchido copiado com sucesso!', currentPromptForVariables.id);
    closeVariableOverlay();
  });

  btnCancelVariables.addEventListener('click', closeVariableOverlay);
  
  variableOverlay.addEventListener('click', (e) => {
    if (e.target === variableOverlay) {
      closeVariableOverlay();
    }
  });

  // Handle Delete
  async function handlePromptDelete(id) {
    const prompt = allPrompts.find(p => p.id === id);
    if (!prompt) return;

    if (confirm(`Tem certeza que deseja excluir o prompt "${prompt.title}"?`)) {
      try {
        await PromptStorage.deletePrompt(id);
        showToast('Prompt excluído com sucesso!');
        loadData(); // Reload and re-render
      } catch (e) {
        console.error('Delete error:', e);
        showToast('Erro ao excluir prompt.', true);
      }
    }
  }

  // Search Input Event
  searchInput.addEventListener('input', (e) => {
    activeSearch = e.target.value;
    renderPrompts();
  });

  // Sort Dropdown Event
  sortSelect.addEventListener('change', (e) => {
    activeSort = e.target.value;
    renderPrompts();
  });

  // --- Drawer Form Management ---
  function openDrawer(id = null) {
    editorForm.reset();
    promptPreview.innerHTML = '<span class="preview-placeholder">Escreva seu prompt acima para ver o destaque de variáveis...</span>';
    charCount.textContent = '0 caracteres';
    wordCount.textContent = '0 palavras';
    
    if (id) {
      // Edit mode
      const prompt = allPrompts.find(p => p.id === id);
      if (!prompt) return;

      drawerTitle.textContent = 'Editar Prompt';
      fieldId.value = prompt.id;
      fieldTitle.value = prompt.title;
      fieldDescription.value = prompt.description || '';
      fieldTags.value = prompt.tags ? prompt.tags.join(', ') : '';
      fieldContent.value = prompt.content;
      
      updateCounters();
      updatePreview();
    } else {
      // Create mode
      drawerTitle.textContent = 'Novo Prompt';
      fieldId.value = '';
    }

    editorDrawer.classList.add('open');
    setTimeout(() => fieldTitle.focus(), 150);
  }

  function closeDrawer() {
    editorDrawer.classList.remove('open');
  }

  // Bind Drawer Open/Close Buttons
  btnAddPrompt.addEventListener('click', () => openDrawer());
  btnCloseDrawer.addEventListener('click', closeDrawer);
  btnCancelEditor.addEventListener('click', closeDrawer);
  drawerBackdrop.addEventListener('click', closeDrawer);

  // Form Submit Handler
  editorForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = fieldTitle.value.trim();
    const description = fieldDescription.value.trim();
    const content = fieldContent.value.trim();
    
    // Parse tags (comma separated)
    const tags = fieldTags.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const promptData = {
      title,
      description,
      content,
      tags
    };

    const id = fieldId.value;
    try {
      if (id) {
        // Update existing
        promptData.id = id;
        await PromptStorage.updatePrompt(promptData);
        showToast('Prompt atualizado com sucesso!');
      } else {
        // Create new
        await PromptStorage.addPrompt(promptData);
        showToast('Prompt adicionado com sucesso!');
      }
      
      closeDrawer();
      loadData();
    } catch (err) {
      console.error('Save error:', err);
      showToast('Erro ao salvar prompt.', true);
    }
  });

  // Textarea input counters and highlights
  fieldContent.addEventListener('input', () => {
    updateCounters();
    updatePreview();
  });

  function updateCounters() {
    const text = fieldContent.value;
    charCount.textContent = `${text.length} caracteres`;
    
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    wordCount.textContent = `${words} palavras`;
  }

  function updatePreview() {
    const text = fieldContent.value;
    if (!text.trim()) {
      promptPreview.innerHTML = '<span class="preview-placeholder">Escreva seu prompt acima para ver o destaque de variáveis...</span>';
      return;
    }

    // Escape HTML to prevent injection in preview
    let escapedText = escapeHTML(text);
    
    // Highlight variables: {{variable}}
    // Since we escaped HTML, the regex matches &lt;&lt; or raw curly brackets which are not affected by html escaping
    const regex = /\{\{([^}]+)\}\}/g;
    const highlighted = escapedText.replace(regex, (match, varName) => {
      return `<span class="preview-var">{{${varName.trim()}}}</span>`;
    });

    promptPreview.innerHTML = highlighted;
  }

  // Parse {{variable}} from text helper
  function extractVariables(text) {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      const varName = match[1].trim();
      if (!variables.includes(varName)) {
        variables.push(varName);
      }
    }
    return variables;
  }

  // --- JSON Backup / Restore Logic ---
  
  // Export Click Handler
  btnExport.addEventListener('click', async () => {
    try {
      const dataStr = await PromptStorage.exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `promptvault-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('Backup exportado com sucesso!');
    } catch (e) {
      console.error('Export error:', e);
      showToast('Falha ao exportar dados.', true);
    }
  });

  // Import Trigger click
  btnImportTrigger.addEventListener('click', () => {
    fileImport.click();
  });

  // File Upload Selection Handler
  fileImport.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target.result;
      const result = await PromptStorage.importData(content);
      
      if (result.success) {
        showToast(`Sucesso! ${result.count} prompts importados/mesclados.`);
        loadData();
      } else {
        showToast(`Erro na importação: ${result.error}`, true);
      }
      
      // Reset input
      fileImport.value = '';
    };
    reader.onerror = () => {
      showToast('Erro ao ler o arquivo de backup.', true);
      fileImport.value = '';
    };
    reader.readAsText(file);
  });

  // Toast System
  let toastTimeout = null;
  function showToast(message, isError = false) {
    if (toastTimeout) clearTimeout(toastTimeout);
    
    toastMessage.textContent = message;
    
    if (isError) {
      toast.classList.add('error');
    } else {
      toast.classList.remove('error');
    }
    
    toast.classList.add('show');
    
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // HTML Escape Helper
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial Load
  loadData();
});
