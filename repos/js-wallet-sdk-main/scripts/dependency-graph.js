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
    console.error(`Failed to read dependencies for ${packagePath}:`, error.message);
    return { dependencies: {}, devDependencies: {} };
  }
}

// Generate dependency graph
function generateDependencyGraph() {
  const packages = getPackages();
  const graph = {};
  const internalPackages = new Set(packages.map(pkg => pkg.name));
  
  console.log('🔍 Analyzing monorepo dependencies...\n');
  
  packages.forEach(pkg => {
    const deps = getDependencies(pkg.location);
    const internalDeps = [];
    const externalDeps = [];
    
    // Analyze dependencies
    Object.keys(deps.dependencies || {}).forEach(dep => {
      if (internalPackages.has(dep)) {
        internalDeps.push(dep);
      } else {
        externalDeps.push(dep);
      }
    });
    
    // Analyze devDependencies
    Object.keys(deps.devDependencies || {}).forEach(dep => {
      if (internalPackages.has(dep)) {
        internalDeps.push(`${dep} (dev)`);
      }
    });
    
    graph[pkg.name] = {
      version: pkg.version,
      internalDeps,
      externalDeps: externalDeps.slice(0, 5), // Only show first 5 external dependencies
      totalExternalDeps: externalDeps.length
    };
  });
  
  return graph;
}

// Display dependency graph
function displayDependencyGraph(graph) {
  console.log('📦 Monorepo Dependency Graph:\n');
  console.log('='.repeat(80));
  
  Object.entries(graph).forEach(([pkgName, info]) => {
    console.log(`\n🔸 ${pkgName} (v${info.version})`);
    console.log('   📍 Location:', pkgName.replace('@ok/', 'bu-packages/'));
    
    if (info.internalDeps.length > 0) {
      console.log('   🔗 Internal dependencies:');
      info.internalDeps.forEach(dep => {
        console.log(`      └── ${dep}`);
      });
    } else {
      console.log('   🔗 Internal dependencies: None');
    }
    
    if (info.externalDeps.length > 0) {
      console.log(`   📚 External dependencies (showing first 5, total ${info.totalExternalDeps}):`);
      info.externalDeps.forEach(dep => {
        console.log(`      └── ${dep}`);
      });
      if (info.totalExternalDeps > 5) {
        console.log(`      └── ... and ${info.totalExternalDeps - 5} more external dependencies`);
      }
    } else {
      console.log('   📚 External dependencies: None');
    }
    
    console.log('-'.repeat(60));
  });
}

// Generate dependency statistics
function generateStats(graph) {
  const stats = {
    totalPackages: Object.keys(graph).length,
    packagesWithInternalDeps: 0,
    packagesWithExternalDeps: 0,
    mostDependentPackage: null,
    mostDependenciesPackage: null,
    maxInternalDeps: 0,
    maxExternalDeps: 0
  };
  
  Object.entries(graph).forEach(([pkgName, info]) => {
    if (info.internalDeps.length > 0) {
      stats.packagesWithInternalDeps++;
    }
    if (info.totalExternalDeps > 0) {
      stats.packagesWithExternalDeps++;
    }
    
    if (info.internalDeps.length > stats.maxInternalDeps) {
      stats.maxInternalDeps = info.internalDeps.length;
      stats.mostDependenciesPackage = pkgName;
    }
    
    if (info.totalExternalDeps > stats.maxExternalDeps) {
      stats.maxExternalDeps = info.totalExternalDeps;
    }
  });
  
  // Find the most dependent package
  const dependencyCount = {};
  Object.values(graph).forEach(info => {
    info.internalDeps.forEach(dep => {
      const cleanDep = dep.replace(' (dev)', '');
      dependencyCount[cleanDep] = (dependencyCount[cleanDep] || 0) + 1;
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
  console.log('\n📊 Dependency Statistics:\n');
  console.log('='.repeat(50));
  console.log(`Total packages: ${stats.totalPackages}`);
  console.log(`Packages with internal dependencies: ${stats.packagesWithInternalDeps}`);
  console.log(`Packages with external dependencies: ${stats.packagesWithExternalDeps}`);
  console.log(`Package with most dependencies: ${stats.mostDependenciesPackage} (${stats.maxInternalDeps} internal dependencies)`);
  console.log(`Most dependent package: ${stats.mostDependentPackage?.name} (depended on by ${stats.mostDependentPackage?.count} packages)`);
  console.log(`Maximum external dependencies: ${stats.maxExternalDeps}`);
}

// Main function
function main() {
  try {
    const graph = generateDependencyGraph();
    displayDependencyGraph(graph);
    const stats = generateStats(graph);
    displayStats(stats);
    
    console.log('\n✅ Dependency analysis completed!');
    console.log('\n💡 Tips:');
    console.log('   - Use "npx lerna list --graph" to view more detailed dependency graph');
    console.log('   - Use "npx lerna list --json" to get JSON format package information');
    console.log('   - Use "npx lerna list --all" to view all packages');
    
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
  generateStats
}; 