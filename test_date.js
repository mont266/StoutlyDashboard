const d = new Date('2026-04-09T00:00:00+01:00'); // Midnight in BST
console.log(d.toISOString());
console.log(d.toISOString().split('T')[0]);
