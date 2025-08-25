# Manuale Utente TeamUp Scheduler

## 1. Introduzione

Benvenuto in **TeamUp Scheduler**! 
Questa applicazione è progettata per semplificare e ottimizzare la complessa gestione degli orari di allenamento per le società sportive dilettantistiche. Permette di definire palestre, squadre, allenatori e le loro necessità di allenamento, per poi pianificare visivamente l'intera stagione su un calendario interattivo.

L'applicazione è interamente **locale**: tutti i dati che inserisci vengono salvati esclusivamente nel tuo browser, garantendo la tua privacy e un funzionamento offline.

---

## 2. Struttura dell'Applicazione

L'applicativo è suddiviso in 5 aree principali, accessibili tramite il menu di navigazione:

1.  **Pagina di Login/Registrazione**: Il punto di accesso all'applicazione.
2.  **Admin Panel**: Il "motore" dell'applicazione, dove si definiscono tutte le risorse (palestre, squadre, coach).
3.  **Scheduler**: Lo strumento di pianificazione visuale dove si assegnano gli allenamenti.
4.  **Dashboard**: Una vista riassuntiva con statistiche e grafici sull'utilizzo delle risorse.
5.  **Pagina di Stampa**: Per generare report tabellari o planner grafici da stampare o salvare in PDF.

---

## 3. Guida all'Uso

### 3.1. Primo Accesso: Registrazione e Login

Poiché i dati sono salvati localmente nel browser, è necessario un sistema per gestirli separatamente se più persone usano lo stesso computer o se vuoi avere più profili.

1.  **Registrazione**: Al primo accesso, vai nella scheda "Registrati". Scegli un nome utente e una password.
    *   **Attenzione**: La sicurezza è minima. Questo sistema serve solo a separare i dati. Non usare password importanti.
2.  **Login**: Una volta registrato, usa le tue credenziali per accedere. L'applicazione caricherà automaticamente la tua ultima configurazione.

### 3.2. Configurazione Iniziale: L'Admin Panel

L'Admin Panel è il primo posto dove andare dopo la registrazione. Qui si definisce tutto ciò che serve per la pianificazione.

#### Gestione Configurazioni
Puoi avere più "scenari" o configurazioni salvate (es. "Stagione 2024/25", "Camp Estivo", "Ipotesi B").
- **Configurazione Attiva**: Il menu a tendina mostra quale configurazione stai modificando.
- **Salva come...**: Duplica la configurazione attuale con un nuovo nome. Utile per creare versioni diverse senza perdere l'originale.
- **Rinomina**: Cambia il nome della configurazione attiva.
- **Elimina**: Cancella la configurazione attiva (non puoi cancellare l'unica esistente).

#### Gestione Palestre
- **Aggiungi Palestra**: Crea una nuova palestra.
- **Modifica**: Cliccando l'icona a matita, puoi cambiarne il nome e, soprattutto, definire gli **orari di disponibilità**. Per ogni giorno della settimana, puoi aggiungere una o più fasce orarie in cui la palestra è utilizzabile. Una palestra senza slot in un giorno risulterà chiusa.

#### Gestione Squadre
- **Aggiungi Squadra**: Crea una nuova squadra, definendo nome e date di inizio/fine stagione.
- **Modifica**: Cliccando l'icona a matita, puoi:
    - Cambiare il nome e le date.
    - Definire le **sessioni di allenamento** necessarie. Per ogni squadra, puoi aggiungere una o più sessioni, specificando la **durata** richiesta (es. 2 allenamenti da 90 minuti, 1 da 75). Queste sessioni appariranno poi nello Scheduler come "da assegnare".

#### Gestione Coach
- **Aggiungi Coach**: Aggiunge un allenatore all'elenco dei disponibili.
- **Modifica/Elimina**: Puoi rinominare o rimuovere un coach. Se un coach viene eliminato, sarà rimosso da tutte le sessioni a cui era stato assegnato.

#### Import/Export
- **Esporta**: Salva **tutte** le tue configurazioni in un singolo file `.json`. Ti verrà chiesto di dare un nome al file. È fondamentale per creare backup e per non perdere il tuo lavoro.
- **Importa**: Carica un file `.json` esportato in precedenza per ripristinare le tue configurazioni.

### 3.3. Pianificazione Visuale: Lo Scheduler

Lo Scheduler è il cuore operativo dell'app.

#### L'Interfaccia
- **Colonne a Sinistra**:
    - **Sessioni da Assegnare**: Contiene tutti gli allenamenti che hai definito nell'Admin Panel ma che non hanno ancora un orario e una palestra.
    - **Coach da Assegnare**: Contiene gli allenatori che non sono stati assegnati a nessuna sessione specifica.
- **Griglia Principale**: La vista del calendario. Puoi visualizzarla in due modi:
    - **Vista per Palestra**: Ogni scheda mostra una palestra, con i giorni della settimana come colonne.
    - **Vista per Giorno**: Ogni scheda mostra un giorno della settimana, con le palestre come colonne.

#### Come Pianificare
1.  **Piazzare un Allenamento**: Trascina ("drag and drop") una sessione dalla colonna "Sessioni da Assegnare" e rilasciala in uno slot orario vuoto nella griglia principale (in corrispondenza di una palestra e un giorno).
2.  **Impostare l'Orario**: Dopo il rilascio, apparirà un pop-up che ti chiederà di specificare l'orario di inizio preciso. Una volta confermato, la sessione apparirà nella griglia.
3.  **Assegnare un Coach**: Trascina un allenatore dalla colonna "Coach da Assegnare" e rilascialo direttamente su una sessione già pianificata nella griglia.
4.  **Modificare una Sessione**: Clicca su una sessione già pianificata. Apparirà un pop-up per modificare l'orario di inizio o per assegnare/cambiare i coach tramite un comodo menu a selezione multipla.
5.  **Spostare una Sessione**: Puoi trascinare una sessione già pianificata da uno slot a un altro.
6.  **Rimuovere dal Calendario**: Per "de-pianificare" una sessione, trascinala dalla griglia e rilasciala di nuovo nella colonna "Sessioni da Assegnare".

### 3.4. Analisi: La Dashboard

La Dashboard offre una panoramica statistica della tua configurazione attiva.
- **Card Superiori**: Mostrano i dati chiave: numero di palestre, squadre, coach, ore totali richieste e disponibili, e la percentuale di utilizzo delle risorse.
- **Grafici Principali**: Confrontano le ore totali disponibili con quelle richieste su base settimanale e stagionale.
- **Tabelle e Grafici di Dettaglio**: Forniscono un'analisi visiva del carico di lavoro per ogni singola squadra, della disponibilità di ogni palestra e dell'impegno di ogni allenatore.

### 3.5. Stampa e Condivisione: La Pagina di Stampa

Questa sezione ti permette di creare documenti professionali da stampare o salvare in PDF.

1.  **Scegli il Formato**:
    - **Stampa Tabellare**: Genera tabelle di testo chiare e compatte. Ideale per report dettagliati. La stampa è ottimizzata per un foglio **verticale (portrait)**.
    - **Stampa Planner**: Genera una vista grafica, simile allo Scheduler. Ideale per una visione d'insieme del palinsesto. La stampa è ottimizzata per un foglio **orizzontale (landscape)**.
2.  **Scegli come Raggruppare**: Per entrambi i formati, puoi decidere se organizzare il report per Palestra, Squadra, Giorno o Coach.
3.  **Filtra**: Dopo aver scelto il raggruppamento, puoi decidere di stampare **tutti** gli elementi (es. tutte le squadre) o di selezionarne uno specifico dal secondo menu a tendina per una stampa mirata.
4.  **Stampa**: Clicca sul pulsante "Stampa / Salva PDF". Si aprirà la finestra di dialogo di stampa del tuo sistema operativo, da cui potrai stampare direttamente o scegliere l'opzione "Salva come PDF".
