#!/usr/bin/env node

import { initializeDatabase, testDatabaseConnection } from '../server/database/init.js';
import { closeDatabasePool } from '../src/lib/database.js';

async function main() {
  console.log('🔧 Инициализация базы данных Copella Notepad');
  console.log('==============================================');

  try {
    // Проверяем подключение
    const connected = await testDatabaseConnection();
    if (!connected) {
      console.error('❌ Не удалось подключиться к базе данных');
      process.exit(1);
    }

    // Инициализируем базу данных
    await initializeDatabase();

    console.log('✅ Инициализация завершена успешно!');
  } catch (error) {
    console.error('💥 Ошибка инициализации:', error);
    process.exit(1);
  } finally {
    // Закрываем соединения
    await closeDatabasePool();
  }
}

main();
