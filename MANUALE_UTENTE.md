# Manuale Utente TeamUp Scheduler

## 1. Introduzione

Benvenuto in **TeamUp Scheduler**! 
Questa applicazione è progettata per semplificare e ottimizzare la complessa gestione degli orari di allenamento per le società sportive dilettantistiche. Permette di definire palestre, squadre, allenatori e le loro necessità di allenamento, per poi pianificare visivamente l'intera stagione su un calendario interattivo.

L'applicazione è interamente **locale**: tutti i dati che inserisci vengono salvati esclusivamente nel tuo browser, garantendo la tua privacy e un funzionamento offline.

---

## 2. Struttura dell'Applicazione

L'applicativo è suddiviso in 5 aree principali, accessibili tramite il menu di navigazione:

1.  **Pagina di Login/Registrazione**: Il punto di accesso all'applicazione per gestire profili separati.
2.  **Admin Panel**: Il "motore" dell'applicazione, dove si definiscono tutte le risorse (palestre, squadre, coach) e si gestiscono i backup.
3.  **Scheduler**: Lo strumento di pianificazione visuale drag-and-drop dove si assegnano gli allenamenti.
4.  **Dashboard**: Una vista riassuntiva con statistiche avanzate e grafici sul carico di lavoro.
5.  **Pagina di Stampa**: Per generare report professionali (tabellari o grafici) da salvare in PDF o stampare.

---

## 3. Guida all'Uso

### 3.1. Primo Accesso: Registrazione e Login

Poiché i dati sono salvati localmente nel browser, è necessario un sistema per gestirli separatamente se più persone usano lo stesso computer.

1.  **Registrazione**: Al primo accesso, vai nella scheda "Registrati". Scegli un nome utente e una password.
    *   **Nota sulla sicurezza**: Questo sistema serve solo a separare i dati locali. Non usare password sensibili.
2.  **Login**: Una volta registrato, usa le tue credenziali per accedere. L'applicazione caricherà automaticamente il tuo profilo e le tue configurazioni.

### 3.2. Configurazione Iniziale: L'Admin Panel

L'Admin Panel è dove si definisce la base di dati per la pianificazione.

#### Gestione Configurazioni
Puoi avere più "scenari" salvati (es. "Stagione Invernale", "Torneo Estivo").
- **Configurazione Attiva**: Il menu a tendina permette di passare da uno scenario all'altro.
- **Salva come...**: Duplica lo scenario attuale con un nuovo nome.
- **Rinomina/Elimina**: Per gestire i nomi degli scenari o rimuovere quelli obsoleti.

#### Gestione Risorse
- **Palestre**: Aggiungi strutture e definisci i loro **orari di disponibilità** per ogni giorno della settimana.
- **Squadre**: Definisci i nomi dei team, le date della stagione e le **sessioni di allenamento richieste** (numero e durata in minuti).
- **Coach**: Aggiungi i nomi degli allenatori disponibili.

#### Backup e Ripristino (Import/Export)
- **Esporta**: Salva **tutte le configurazioni** del tuo profilo in un singolo file `.json`. Ti verrà chiesto di dare un nome al file. È fondamentale per creare backup periodici o trasferire i dati su un altro computer.
- **Importa**: Carica un file `.json` precedentemente esportato per ripristinare interamente il tuo database di lavoro.

### 3.3. Pianificazione Visuale: Lo Scheduler

Lo Scheduler permette di posizionare gli allenamenti sulla griglia temporale.

#### L'Interfaccia
- **Colonne a Sinistra**: Contengono le "Sessioni da Assegnare" (quelle definite per le squadre) e i "Coach da Assegnare" (quelli non ancora impegnati).
- **Griglia Centrale**: Mostra il calendario. Puoi scegliere tra **Vista per Palestra** (una scheda per ogni struttura) o **Vista per Giorno** (una scheda per ogni giorno della settimana).

#### Come Pianificare
1.  **Posizionare**: Trascina una sessione dalla colonna sinistra sulla griglia. Un pop-up ti chiederà l'**orario di inizio preciso**.
2.  **Assegnare Coach**: Trascina un coach dalla lista di sinistra direttamente sopra una sessione già pianificata sulla griglia.
3.  **Modificare/Spostare**: Clicca su una sessione in griglia per cambiare orario o gestire i coach (selezione multipla). Puoi anche trascinare una sessione già pianificata per spostarla di orario o palestra.
4.  **Rimuovere**: Trascina una sessione dalla griglia di nuovo verso la colonna "Sessioni da Assegnare" per toglierla dal calendario.

### 3.4. Analisi: La Dashboard

La Dashboard offre una panoramica statistica della tua configurazione attiva.
- **Card Superiori**: Indicatori chiave centrati con icone (totale palestre, squadre, coach, ore settimanali e percentuale di utilizzo).
- **Grafici Principali**: Confronto tra ore disponibili (Blu Navy) e richieste (Granata).
- **Analisi Dettagliata**: Tabelle e grafici specifici per ogni Squadra, Palestra e Coach, permettendoti di individuare sovraccarichi o risorse inutilizzate.

### 3.5. Stampa e Condivisione: La Pagina di Stampa

Scegli come presentare il tuo lavoro finale:

1.  **Formati**:
    *   **Stampa Tabellare**: Report testuale preciso, ottimizzato per fogli in verticale (Portrait).
    *   **Stampa Planner**: Report grafico (tipo calendario) con blocchi colorati, ottimizzato per fogli in orizzontale (Landscape).
2.  **Ottimizzazioni Intelligenti**:
    *   **Planner Grafico**: La scala temporale verticale si adatta automaticamente dal primo all'ultimo allenamento della giornata per massimizzare la leggibilità.
    *   **Filtri**: Puoi decidere di stampare il programma completo ("Tutti") o filtrare per una specifica Palestra, Squadra, Giorno o Coach.
3.  **Salvataggio**: Clicca "Stampa / Salva PDF" per generare il documento finale tramite le funzioni del tuo browser.

---

## 4. Consigli Utili

- **Esporta spesso**: Essendo i dati salvati solo nel browser, pulire la cache del browser potrebbe cancellarli. Esporta regolarmente un file di backup sul tuo PC.
- **Leggibilità Planner**: Se hai molti allenamenti concentrati, la stampa Planner in orizzontale è la scelta migliore per avere una visione d'insieme chiara.
- **Colori**: L'applicazione assegna automaticamente colori diversi alle squadre per aiutarti a distinguerle a colpo d'occhio nello Scheduler e nel Planner.