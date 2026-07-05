// PromptVault Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const searchInput = document.getElementById('search-input');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const tagsContainer = document.getElementById('tags-container');
  const promptsList = document.getElementById('prompts-list');
  const btnDashboard = document.getElementById('btn-dashboard');
  const btnClosePopup = document.getElementById('btn-close-popup');
  const btnNewPrompt = document.getElementById('btn-new-prompt');
  
  // Overlay Elements
  const variableOverlay = document.getElementById('variable-overlay');
  const variableForm = document.getElementById('variable-form');
  const variablesInputsContainer = document.getElementById('variables-inputs-container');
  const btnCancelVariables = document.getElementById('btn-cancel-variables');

  // State Variables
  let allPrompts = [];
  let activeTag = 'Todos';
  let activeSearch = '';
  let currentPromptForVariables = null;

  // Initialize Storage & Data
  async function loadData() {
    try {
      allPrompts = await PromptStorage.getPrompts();
      
      // Sort prompts by lastUsed descending (recently used first)
      allPrompts.sort((a, b) => b.lastUsed - a.lastUsed);
      
      renderTags();
      renderPrompts();
    } catch (e) {
      console.error('Error loading prompts:', e);
      promptsList.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>Erro ao carregar prompts. Tente recarregar a extensão.</p>
        </div>
      `;
    }
  }

  // Render Tags Filter List
  function renderTags() {
    const tags = new Set();
    allPrompts.forEach(p => {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach(tag => {
          if (tag.trim()) tags.add(tag.trim());
        });
      }
    });

    const sortedTags = Array.from(tags).sort();
    
    // Add "Todos" at the beginning
    let html = `<button class="tag-pill ${activeTag === 'Todos' ? 'active' : ''}" data-tag="Todos">Todos</button>`;
    
    sortedTags.forEach(tag => {
      html += `<button class="tag-pill ${activeTag === tag ? 'active' : ''}" data-tag="${tag}">${tag}</button>`;
    });

    tagsContainer.innerHTML = html;

    // Attach Tag Events
    document.querySelectorAll('.tag-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        document.querySelector('.tag-pill.active')?.classList.remove('active');
        e.target.classList.add('active');
        activeTag = e.target.dataset.tag;
        renderPrompts();
      });
    });
  }

  // Render Prompts Cards
  function renderPrompts() {
    // Filter
    const filtered = allPrompts.filter(p => {
      // Filter by Tag
      const matchesTag = activeTag === 'Todos' || (p.tags && p.tags.includes(activeTag));
      
      // Filter by Search
      const searchLower = activeSearch.toLowerCase();
      const matchesSearch = !activeSearch || 
        p.title.toLowerCase().includes(searchLower) ||
        p.content.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(searchLower)));

      return matchesTag && matchesSearch;
    });

    // Empty state
    if (filtered.length === 0) {
      promptsList.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p>${activeSearch || activeTag !== 'Todos' ? 'Nenhum prompt corresponde aos filtros.' : 'Sua PromptVault está vazia!'}</p>
        </div>
      `;
      return;
    }

    // Build Cards HTML
    promptsList.innerHTML = filtered.map(p => {
      const vars = extractVariables(p.content);
      const hasVars = vars.length > 0;
      
      const tagsHtml = p.tags && Array.isArray(p.tags) 
        ? p.tags.map(t => `<span class="prompt-tag">${t}</span>`).join('') 
        : '';
        
      const varsBadge = hasVars 
        ? `<span class="prompt-vars-badge" title="Contém ${vars.length} variáveis dinâmicas">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:10px; height:10px;">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            ${vars.length} vars
           </span>`
        : '';

      return `
        <div class="prompt-card" data-id="${p.id}">
          <div class="prompt-header">
            <h3 class="prompt-title">${escapeHTML(p.title)}</h3>
            <p class="prompt-description">${escapeHTML(p.description || '')}</p>
          </div>
          <div class="prompt-body">${escapeHTML(p.content)}</div>
          <div class="prompt-footer">
            <div class="prompt-tags">
              ${tagsHtml}
            </div>
            ${varsBadge}
          </div>
          <button class="btn-quick-copy" data-id="${p.id}" title="Copiar prompt">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="copy-svg">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
        </div>
      `;
    }).join('');

    // Attach click events on cards (opens variable modal or copies directly)
    document.querySelectorAll('.prompt-card').forEach(card => {
      // Standard click (trigger copy workflow)
      card.addEventListener('click', (e) => {
        // Prevent trigger if clicking the inner tags or specific sub-buttons
        if (e.target.closest('.btn-quick-copy')) return;
        
        const id = card.dataset.id;
        handlePromptActivation(id);
      });
    });

    // Attach click events on the quick copy button directly
    document.querySelectorAll('.btn-quick-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        handlePromptActivation(id);
      });
    });
  }

  // Handle click / activation of a prompt card
  function handlePromptActivation(id) {
    const prompt = allPrompts.find(p => p.id === id);
    if (!prompt) return;

    const vars = extractVariables(prompt.content);

    if (vars.length > 0) {
      // Has variables! Open Overlay Modal
      openVariableOverlay(prompt, vars);
    } else {
      // Just copy directly
      copyTextToClipboard(prompt.content, prompt.id);
    }
  }

  // Parse {{variable}} from text
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

      // Use textarea for inputs that might be long (like 'codigo', 'texto', 'content')
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
    
    // Focus first input
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

  // Process Variable Overlay Submit with validation
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
      // Replace all occurrences of {{key}}
      // Escape special characters in key for regex matching
      const escapedKey = key.replace(/[-/\^$*+?.()|[\]{}]/g, '\$&');
      const regex = new RegExp(`\{\{\s*${escapedKey}\s*\}\}`, 'g');
      finalPromptContent = finalPromptContent.replace(regex, value);
    });

    // Validate that all variables were filled
    const emptyVars = Object.entries(filledValues).filter(([_, value]) => !value.trim());
    if (emptyVars.length > 0) {
      alert(`Por favor, preencha todos os campos: ${emptyVars.map(([k]) => k).join(', ')}`);
      return;
    }

    copyTextToClipboard(finalPromptContent, currentPromptForVariables.id);
    closeVariableOverlay();
  });

  // Cancel Variables Overlay
  btnCancelVariables.addEventListener('click', closeVariableOverlay);
  
  // Close overlay clicking outside card
  variableOverlay.addEventListener('click', (e) => {
    if (e.target === variableOverlay) {
      closeVariableOverlay();
    }
  });

  // Copy to Clipboard & Show Toast
  function copyTextToClipboard(text, promptId) {
    navigator.clipboard.writeText(text).then(() => {
      // Toast Animation
      const toast = document.getElementById('toast');
      toast.classList.add('show');
      
      // Update visual state of the copy button briefly
      if (promptId) {
        const card = document.querySelector(`.prompt-card[data-id="${promptId}"]`);
        const copyBtn = card?.querySelector('.btn-quick-copy');
        if (copyBtn) {
          const originalSVG = copyBtn.innerHTML;
          copyBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          `;
          copyBtn.style.background = '#10b981'; // Green accent feedback
          setTimeout(() => {
            copyBtn.innerHTML = originalSVG;
            copyBtn.style.background = '';
          }, 1500);
        }
        
        // Save lastUsed update async
        PromptStorage.updateLastUsed(promptId).then(() => {
          // Re-sort in memory
          const pIndex = allPrompts.findIndex(p => p.id === promptId);
          if (pIndex !== -1) {
            allPrompts[pIndex].lastUsed = Date.now();
          }
        });
      }

      setTimeout(() => {
        toast.classList.remove('show');
      }, 2500);
    }).catch(err => {
      console.error('Falha ao copiar texto:', err);
      alert('Erro ao copiar para a área de transferência.');
    });
  }

  // Search Logic
  searchInput.addEventListener('input', (e) => {
    activeSearch = e.target.value.trim();
    if (activeSearch) {
      btnClearSearch.style.display = 'flex';
    } else {
      btnClearSearch.style.display = 'none';
    }
    renderPrompts();
  });

  // Clear Search
  btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    activeSearch = '';
    btnClearSearch.style.display = 'none';
    searchInput.focus();
    renderPrompts();
  });

  // Navigation Logic - Open options page / dashboard
  function openDashboard(tabUrl = '') {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      // In web development mode
      window.open('../dashboard/dashboard.html' + tabUrl, '_blank');
    }
  }

  btnDashboard.addEventListener('click', () => openDashboard());
  
  btnNewPrompt.addEventListener('click', () => {
    openDashboard('?action=new');
  });

  // Close popup window - communicate with background script
  if (btnClosePopup) {
    btnClosePopup.addEventListener('click', () => {
      // Send message to background script to close the popup window
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'closePopup' });
      } else {
        // Fallback for regular windows
        window.close();
      }
    });
  }

  // Helper function to escape HTML special chars
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
