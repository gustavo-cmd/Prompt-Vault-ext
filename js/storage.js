// PromptVault Unified Storage Utility
// Automatically handles Chrome Storage API or falls back to localStorage for web/development environment

const DEFAULT_PROMPTS = [
  {
    id: "default-refactor",
    title: "Refatoração de Código",
    description: "Analisa código procurando otimizações de performance, segurança e legibilidade.",
    content: "Aja como um Engenheiro de Software Principal. Analise o código em {{linguagem}} abaixo e sugira melhorias focando em:\n1. Gargalos de performance\n2. Vulnerabilidades de segurança\n3. Legibilidade e adesão às melhores práticas (Clean Code)\n\nCódigo:\n```{{linguagem}}\n{{codigo}}\n```\n\nPor favor, apresente as sugestões em formato Markdown e mostre o código refatorado.",
    tags: ["Programação", "Refatoração", "Review"],
    created: Date.now() - 3600000 * 3, // 3 hours ago
    lastUsed: Date.now() - 3600000 * 2
  },
  {
    id: "default-copywriter",
    title: "Copywriter de Conversão",
    description: "Cria copys persuasivas para produtos baseadas em frameworks de marketing.",
    content: "Aja como um Copywriter Sênior especializado em conversão direta. Escreva uma copy de vendas persuasiva para o produto/serviço '{{produto}}'.\n\nPersona Alvo: {{persona}}\nTom de Voz: {{tom}}\n\nUse o framework AIDA (Atenção, Interesse, Desejo, Ação) para estruturar o texto. Inclua um título irresistível, 3 bullet points com benefícios principais focados na dor do cliente e uma chamada para ação (CTA) clara.",
    tags: ["Marketing", "Escrita", "Vendas"],
    created: Date.now() - 3600000 * 2, // 2 hours ago
    lastUsed: Date.now() - 3600000 * 1
  },
  {
    id: "default-feynman",
    title: "Método Feynman (Explicar para Criança)",
    description: "Explica conceitos complexos de forma extremamente simples e didática.",
    content: "Gostaria de entender o conceito de '{{conceito}}'. Explique-o utilizando a Técnica Feynman, como se estivesse ensinando para uma criança de 10 anos de idade.\n\nRegras:\n1. Evite termos técnicos avançados ou, se precisar usar, explique-os com uma metáfora simples.\n2. Use uma analogia do dia a dia.\n3. Vá direto ao ponto de forma visual e intuitiva.",
    tags: ["Educação", "Didática", "Produtividade"],
    created: Date.now() - 3600000, // 1 hour ago
    lastUsed: Date.now()
  },
  {
    id: "default-unittests",
    title: "Gerador de Testes Unitários",
    description: "Escreve testes automatizados completos cobrindo caminhos felizes e exceções.",
    content: "Crie uma suíte de testes unitários robusta para o código abaixo escrito em {{linguagem}}.\n\nFramework de teste a ser utilizado: {{framework}}\n\nCódigo:\n```{{linguagem}}\n{{codigo}}\n```\n\nCertifique-se de cobrir:\n- O caminho principal (happy path)\n- Casos de borda (edge cases)\n- Tratamento de erros e exceções esperadas",
    tags: ["Programação", "Testes", "QA"],
    created: Date.now() - 1800000, // 30 mins ago
    lastUsed: Date.now() - 600000
  }
];

const PromptStorage = {
  // Helper to check if running inside a Chrome extension environment
  isExtension() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  },

  // Get all prompts
  getPrompts() {
    return new Promise((resolve) => {
      if (this.isExtension()) {
        chrome.storage.local.get(['prompts'], (result) => {
          if (result.prompts) {
            resolve(result.prompts);
          } else {
            // First run: save defaults and return them
            this.savePrompts(DEFAULT_PROMPTS).then(() => {
              resolve(DEFAULT_PROMPTS);
            });
          }
        });
      } else {
        const localData = localStorage.getItem('prompt_vault_prompts');
        if (localData) {
          try {
            resolve(JSON.parse(localData));
          } catch (e) {
            console.error('Error parsing localStorage prompts:', e);
            resolve(DEFAULT_PROMPTS);
          }
        } else {
          // First run in web fallback
          localStorage.setItem('prompt_vault_prompts', JSON.stringify(DEFAULT_PROMPTS));
          resolve(DEFAULT_PROMPTS);
        }
      }
    });
  },

  // Save all prompts
  savePrompts(prompts) {
    return new Promise((resolve) => {
      if (this.isExtension()) {
        chrome.storage.local.set({ prompts }, () => {
          resolve(true);
        });
      } else {
        localStorage.setItem('prompt_vault_prompts', JSON.stringify(prompts));
        resolve(true);
      }
    });
  },

  // Add a new prompt
  async addPrompt(prompt) {
    const prompts = await this.getPrompts();
    const newPrompt = {
      ...prompt,
      id: 'prompt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      created: Date.now(),
      lastUsed: Date.now()
    };
    prompts.push(newPrompt);
    await this.savePrompts(prompts);
    return newPrompt;
  },

  // Update an existing prompt
  async updatePrompt(updatedPrompt) {
    const prompts = await this.getPrompts();
    const index = prompts.findIndex(p => p.id === updatedPrompt.id);
    if (index !== -1) {
      prompts[index] = {
        ...prompts[index],
        ...updatedPrompt,
        // Keep original created date if not specified
        created: updatedPrompt.created || prompts[index].created || Date.now()
      };
      await this.savePrompts(prompts);
      return prompts[index];
    }
    return null;
  },

  // Delete a prompt
  async deletePrompt(id) {
    let prompts = await this.getPrompts();
    prompts = prompts.filter(p => p.id !== id);
    await this.savePrompts(prompts);
    return true;
  },

  // Update prompt last used timestamp (for sorting by recent)
  async updateLastUsed(id) {
    const prompts = await this.getPrompts();
    const index = prompts.findIndex(p => p.id === id);
    if (index !== -1) {
      prompts[index].lastUsed = Date.now();
      await this.savePrompts(prompts);
      return prompts[index];
    }
    return null;
  },

  // Export prompts as JSON string
  async exportData() {
    const prompts = await this.getPrompts();
    const dataStr = JSON.stringify(prompts, null, 2);
    return dataStr;
  },

  // Import prompts from JSON string
  async importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data)) {
        throw new Error('Data must be an array of prompts');
      }
      
      // Basic validation
      const validatedData = data.map(item => {
        if (!item.title || !item.content) {
          throw new Error('Prompts must contain a title and content');
        }
        return {
          id: item.id || 'prompt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          title: item.title,
          description: item.description || '',
          content: item.content,
          tags: Array.isArray(item.tags) ? item.tags : [],
          created: item.created || Date.now(),
          lastUsed: item.lastUsed || Date.now()
        };
      });

      // Get current prompts and merge (avoid duplicates by ID if possible, otherwise append)
      const currentPrompts = await this.getPrompts();
      const currentIds = new Set(currentPrompts.map(p => p.id));
      
      const mergedPrompts = [...currentPrompts];
      validatedData.forEach(p => {
        if (currentIds.has(p.id)) {
          // Overwrite existing or regenerate ID to avoid conflict? Let's overwrite
          const idx = mergedPrompts.findIndex(cp => cp.id === p.id);
          mergedPrompts[idx] = p;
        } else {
          mergedPrompts.push(p);
        }
      });

      await this.savePrompts(mergedPrompts);
      return { success: true, count: validatedData.length };
    } catch (e) {
      console.error('Import error:', e);
      return { success: false, error: e.message };
    }
  }
};

// Make it globally available on browser pages or in extensions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PromptStorage;
} else {
  window.PromptStorage = PromptStorage;
}
