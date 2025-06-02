#!/usr/bin/env node

// Interactive Database Management Script
import { exec } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';

const execAsync = promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function showMenu() {
  console.log('\n🗄️  APPWRITE DATABASE MANAGEMENT');
  console.log('='.repeat(40));
  console.log('1. 🔍 Inspect Database (View current state)');
  console.log('2. 🏗️  Create Collections (Initial setup)');
  console.log('3. 🔧 Fix Missing Attributes');
  console.log('4. 🔐 Update Permissions');
  console.log('5. 🚀 Full Setup (All operations)');
  console.log('6. ❌ Exit');
  console.log('='.repeat(40));
}

async function runCommand(command) {
  console.log(`\n▶️  Running: npm run db:${command}\n`);
  
  try {
    const { stdout, stderr } = await execAsync(`npm run db:${command}`, {
      cwd: process.cwd()
    });
    
    console.log(stdout);
    if (stderr) {
      console.error('Warnings/Errors:', stderr);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
  }
}

async function main() {
  console.log('Welcome to the Database Management Tool!');
  
  while (true) {
    showMenu();
    const choice = await question('\nSelect an option (1-6): ');
    
    switch (choice.trim()) {
      case '1':
        await runCommand('inspect');
        break;
      case '2':
        await runCommand('create');
        break;
      case '3':
        await runCommand('fix');
        break;
      case '4':
        await runCommand('permissions');
        break;
      case '5':
        await runCommand('setup');
        break;
      case '6':
        console.log('\n👋 Goodbye!');
        rl.close();
        return;
      default:
        console.log('\n❌ Invalid option. Please select 1-6.');
    }
    
    const continueChoice = await question('\nPress Enter to continue or type "exit" to quit: ');
    if (continueChoice.toLowerCase() === 'exit') {
      console.log('\n👋 Goodbye!');
      rl.close();
      return;
    }
  }
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  rl.close();
  process.exit(1);
});
