#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get all package information
function getPackages() {
  try {
    const output = execSync('npx lerna list --json', { encoding: 'utf8' });
    return JSON.parse(output);
  } catch (error) {
    console.error('Failed to get package information:', error.message);
    return [];
  }
}

// Get package dependencies
function getDependencies(packagePath) {
  try {
    const packageJsonPath = path.join(packagePath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return { dependencies: {}, devDependencies: {} };
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return {
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {}
    };
  } catch (error) {
    return { dependencies: {}, devDependencies: {} };
  }
}

// Generate dependency graph
function generateDependencyGraph() {
  const packages = getPackages();
  const graph = {};
  const internalPackages = new Set(packages.map(pkg => pkg.name));
  
  packages.forEach(pkg => {
    const deps = getDependencies(pkg.location);
    const internalDeps = [];
    
    // Analyze dependencies
    Object.keys(deps.dependencies || {}).forEach(dep => {
      if (internalPackages.has(dep)) {
        internalDeps.push(dep);
      }
    });
    
    // Analyze devDependencies
    Object.keys(deps.devDependencies || {}).forEach(dep => {
      if (internalPackages.has(dep)) {
        internalDeps.push(dep);
      }
    });
    
    graph[pkg.name] = internalDeps;
  });
  
  return graph;
}

// Generate ASCII dependency graph
function generateAsciiGraph(graph) {
  const packages = Object.keys(graph);
  const corePackages = ['@ok/crypto-lib', '@ok/coin-base'];
  const coinPackages = packages.filter(pkg => pkg.startsWith('@ok/coin-') && !corePackages.includes(pkg));
  const otherPackages = packages.filter(pkg => !pkg.startsWith('@ok/coin-') && !corePackages.includes(pkg));
  
  let output = '';
  output += '🔗 Monorepo Dependency Graph\n';
  output += '='.repeat(80) + '\n\n';
  
  // Core packages layer
  output += '📦 Core Packages (Foundation Layer):\n';
  output += '┌' + '─'.repeat(78) + '┐\n';
  corePackages.forEach(pkg => {
    const shortName = pkg.replace('@ok/', '');
    output += `│ ${shortName.padEnd(20)} `;
    const deps = graph[pkg] || [];
    if (deps.length > 0) {
      output += `→ ${deps.map(d => d.replace('@ok/', '')).join(', ')}`;
    } else {
      output += '(No internal dependencies)';
    }
    output += ' '.repeat(Math.max(0, 50 - (deps.length > 0 ? deps.map(d => d.replace('@ok/', '')).join(', ').length : 20))) + '│\n';
  });
  output += '└' + '─'.repeat(78) + '┘\n\n';
  
  // Coin packages layer
  output += '🪙 Coin Packages (Application Layer):\n';
  output += '┌' + '─'.repeat(78) + '┐\n';
  
  // Group by dependency count
  const groupedCoins = {};
  coinPackages.forEach(pkg => {
    const deps = graph[pkg] || [];
    const depCount = deps.length;
    if (!groupedCoins[depCount]) {
      groupedCoins[depCount] = [];
    }
    groupedCoins[depCount].push(pkg);
  });
  
  // Display sorted by dependency count
  Object.keys(groupedCoins).sort((a, b) => parseInt(a) - parseInt(b)).forEach(depCount => {
    const pkgs = groupedCoins[depCount];
    pkgs.forEach(pkg => {
      const shortName = pkg.replace('@ok/', '');
      output += `│ ${shortName.padEnd(20)} `;
      const deps = graph[pkg] || [];
      if (deps.length > 0) {
        output += `→ ${deps.map(d => d.replace('@ok/', '')).join(', ')}`;
      } else {
        output += '(No internal dependencies)';
      }
      output += ' '.repeat(Math.max(0, 50 - (deps.length > 0 ? deps.map(d => d.replace('@ok/', '')).join(', ').length : 20))) + '│\n';
    });
  });
  
  output += '└' + '─'.repeat(78) + '┘\n\n';
  
  // Other packages layer
  if (otherPackages.length > 0) {
    output += '🔧 Other Packages (Utility Layer):\n';
    output += '┌' + '─'.repeat(78) + '┐\n';
    otherPackages.forEach(pkg => {
      const shortName = pkg.replace('@ok/', '');
      output += `│ ${shortName.padEnd(20)} `;
      const deps = graph[pkg] || [];
      if (deps.length > 0) {
        output += `→ ${deps.map(d => d.replace('@ok/', '')).join(', ')}`;
      } else {
        output += '(No internal dependencies)';
      }
      output += ' '.repeat(Math.max(0, 50 - (deps.length > 0 ? deps.map(d => d.replace('@ok/', '')).join(', ').length : 20))) + '│\n';
    });
    output += '└' + '─'.repeat(78) + '┘\n\n';
  }
  
  return output;
}

// Generate dependency statistics
function generateStats(graph) {
  const stats = {
    totalPackages: Object.keys(graph).length,
    corePackages: 0,
    coinPackages: 0,
    otherPackages: 0,
    mostDependentPackage: null,
    mostDependenciesPackage: null,
    maxDependencies: 0
  };
  
  const dependencyCount = {};
  
  Object.entries(graph).forEach(([pkgName, deps]) => {
    if (pkgName === '@ok/crypto-lib' || pkgName === '@ok/coin-base') {
      stats.corePackages++;
    } else if (pkgName.startsWith('@ok/coin-')) {
      stats.coinPackages++;
    } else {
      stats.otherPackages++;
    }
    
    if (deps.length > stats.maxDependencies) {
      stats.maxDependencies = deps.length;
      stats.mostDependenciesPackage = pkgName;
    }
    
    deps.forEach(dep => {
      dependencyCount[dep] = (dependencyCount[dep] || 0) + 1;
    });
  });
  
  const mostDependent = Object.entries(dependencyCount)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (mostDependent) {
    stats.mostDependentPackage = {
      name: mostDependent[0],
      count: mostDependent[1]
    };
  }
  
  return stats;
}

// Display statistics
function displayStats(stats) {
  let output = '';
  output += '📊 Dependency Statistics:\n';
  output += '='.repeat(50) + '\n';
  output += `Total packages: ${stats.totalPackages}\n`;
  output += `Core packages: ${stats.corePackages}\n`;
  output += `Coin packages: ${stats.coinPackages}\n`;
  output += `Other packages: ${stats.otherPackages}\n`;
  output += `Package with most dependencies: ${stats.mostDependenciesPackage?.replace('@ok/', '')} (${stats.maxDependencies} dependencies)\n`;
  output += `Most dependent package: ${stats.mostDependentPackage?.name.replace('@ok/', '')} (depended on by ${stats.mostDependentPackage?.count} packages)\n`;
  output += '='.repeat(50) + '\n';
  
  return output;
}

// Main function
function main() {
  try {
    console.log('🔍 Analyzing monorepo dependencies...\n');
    
    const graph = generateDependencyGraph();
    const asciiGraph = generateAsciiGraph(graph);
    const stats = generateStats(graph);
    const statsOutput = displayStats(stats);
    
    console.log(asciiGraph);
    console.log(statsOutput);
    
    console.log('✅ Dependency analysis completed!\n');
    console.log('💡 Usage tips:');
    console.log('   • npx lerna list --graph     # View detailed dependency graph');
    console.log('   • npx lerna list --json      # Get JSON format package information');
    console.log('   • npx lerna list --all       # View all packages');
    console.log('   • node scripts/dependency-graph.js  # View detailed dependency analysis');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  generateDependencyGraph,
  generateAsciiGraph,
  generateStats
}; 