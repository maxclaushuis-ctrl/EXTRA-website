// Temporary script to fix all challenge step definitions at once
const fs = require('fs');

const storageContent = fs.readFileSync('server/storage.ts', 'utf8');

// Add isCompleted: null to all challengeSteps.set calls
const fixedContent = storageContent.replace(
  /this\.challengeSteps\.set\(\d+, \{([^}]+)\}\);/g,
  (match, content) => {
    if (!content.includes('isCompleted:')) {
      const lines = content.split('\n');
      const lastLineIndex = lines.findIndex(line => line.includes('updatedAt: new Date()'));
      if (lastLineIndex !== -1) {
        lines.splice(lastLineIndex, 0, '      isCompleted: null,');
        return `this.challengeSteps.set(${match.match(/\d+/)[0]}, {${lines.join('\n')}});`;
      }
    }
    return match;
  }
);

fs.writeFileSync('server/storage.ts', fixedContent);
console.log('Fixed all challenge steps');