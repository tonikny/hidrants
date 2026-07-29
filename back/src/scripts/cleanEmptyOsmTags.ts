#!/usr/bin/env tsx
/**
 * Script per netejar tags OSM amb valors buits dels hidrants existents
 *
 * Problema: Alguns hidrants tenen tags com "disused:emergency": "" o "emergency": ""
 * que haurien d'haver estat eliminats en lloc de guardar-se com a strings buits.
 *
 * Aquest script:
 * 1. Llegeix tots els hidrants de la BD
 * 2. Parseja osm_tags de cada hidrant
 * 3. Elimina les claus amb valor buit ("")
 * 4. Actualitza la BD amb els tags nets
 *
 * Ús: npm run tsx src/scripts/cleanEmptyOsmTags.ts
 */

import { db } from '../db/index.js';
import { hidrants } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function cleanEmptyOsmTags() {
  console.log('🧹 Iniciant neteja de tags OSM buits...\n');

  try {
    // Obtenir tots els hidrants
    const allHidrants = db.select().from(hidrants).all();

    console.log(`📊 Total d'hidrants a la BD: ${allHidrants.length}\n`);

    let updatedCount = 0;
    let emptyTagsFound = 0;

    for (const hidrant of allHidrants) {
      const osmTags = JSON.parse(hidrant.osm_tags || '{}');
      const originalKeys = Object.keys(osmTags);

      // Filtrar tags amb valor buit
      const cleanedTags: Record<string, string> = {};
      let hasEmptyTags = false;

      for (const [key, value] of Object.entries(osmTags)) {
        if (value === '' || value === null || value === undefined) {
          hasEmptyTags = true;
          emptyTagsFound++;
          console.log(
            `  ⚠️  Hidrant ${hidrant.id}: Tag buit detectat: "${key}": "${value}"`
          );
        } else {
          cleanedTags[key] = value as string;
        }
      }

      // Si hi havia tags buits, actualitzar la BD
      if (hasEmptyTags) {
        const cleanedKeys = Object.keys(cleanedTags);
        console.log(`  ✏️  Actualitzant hidrant ${hidrant.id}`);
        console.log(
          `     Abans: ${originalKeys.length} tags -> Després: ${cleanedKeys.length} tags`
        );
        console.log(
          `     Tags eliminats: ${originalKeys
            .filter((k) => !cleanedKeys.includes(k))
            .join(', ')}\n`
        );

        db.update(hidrants)
          .set({ osm_tags: JSON.stringify(cleanedTags) })
          .where(eq(hidrants.id, hidrant.id))
          .run();

        updatedCount++;
      }
    }

    console.log('\n✅ Neteja completada!');
    console.log(`📈 Resum:`);
    console.log(`   - Hidrants processats: ${allHidrants.length}`);
    console.log(`   - Hidrants actualitzats: ${updatedCount}`);
    console.log(`   - Tags buits eliminats: ${emptyTagsFound}`);

    if (updatedCount === 0) {
      console.log(
        "\n🎉 No s'han trobat tags buits. La base de dades ja estava neta!"
      );
    }
  } catch (error) {
    console.error('❌ Error durant la neteja:', error);
    process.exit(1);
  }
}

// Executar el script
cleanEmptyOsmTags()
  .then(() => {
    console.log('\n👋 Script finalitzat correctament.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
