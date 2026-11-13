# HylteKollen – kodkopia av version 66

[Öppna den publicerade Hyltekollen](https://hyltekollen.karlsvenniklas.chatgpt.site/)

Detta är en granskad, kodbaserad ögonblicksbild av Sites-version 66 från 11 november 2026. Ursprunglig källcommit i Sites: `31dd0044a878c3d679171a3802d0a6320b2f6206`.

- `app/`, `components/`, `hooks/`, `lib/`: webbgränssnitt och funktioner.
- `db/`, `drizzle/`: databasschema och migreringar, utan databasdump.
- `scripts/`: import, verifiering och tester.
- Paketmanifest, låsfil, byggkod och licenstexter för medföljande tredjepartskod.

Version 66 innehåller reparerad MeetingPlus-hämtning och testet `scripts/test-meeting-response.py`. Protokolldata, källsnapshots, arbetsmaterial, ljud, lokal miljökonfiguration och den skarpa Sites-konfigurationen ingår inte. Den lokala bootstrap-sökvägen i importskriptet är ersatt med en relativ sökväg, och ignoreringsreglerna från den granskade v65-kopian är kvar. Bygge och tester som kräver de utelämnade datamängderna kan inte köras från kopian som den är.

Sites är fortfarande källan för den levande webbplatsen. GitHub-grenen är en kodkopia, inte en automatisk synk, fullständig säkerhetskopia eller publiceringskälla.
