import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { memberDir, recordPathFor, photoPathFor, listMemberHandles } from './member-paths.mjs';

describe('chemins par membre', () => {
  it('place la fiche et la photo dans le dossier du membre', () => {
    assert.equal(memberDir('octocat'), 'data/members/octocat');
    assert.equal(recordPathFor('octocat'), 'data/members/octocat/record.yml');
    assert.equal(photoPathFor('octocat'), 'data/members/octocat/photo.webp');
  });
});

describe('listMemberHandles', () => {
  it('ne liste que les dossiers contenant un record.yml, triés', () => {
    // Arrange : un registre temporaire avec deux fiches et un dossier parasite.
    const root = mkdtempSync(join(tmpdir(), 'members-'));
    for (const h of ['zoe', 'ada']) {
      mkdirSync(join(root, h));
      writeFileSync(join(root, h, 'record.yml'), `github: "${h}"\n`);
    }
    mkdirSync(join(root, 'sans-fiche')); // dossier sans record.yml -> ignoré

    // Act
    const handles = listMemberHandles(root);

    // Assert
    assert.deepEqual(handles, ['ada', 'zoe']);
  });

  it('rend une liste vide si le registre n\'existe pas', () => {
    assert.deepEqual(listMemberHandles('/n/existe/pas'), []);
  });
});
