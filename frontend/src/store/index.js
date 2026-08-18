import { configureStore, createSlice } from '@reduxjs/toolkit';

const DEFAULT_FORM_STATE = {
  status: 'Pending Triage', // 'Pending Triage' or 'Ready to Commit'
  complaint_source: '',
  customer_name: '',
  product_name: '',
  product_strength_grade: '',
  batch_lot_number: '',
  affected_quantity: '',
  manufacturing_date: '',
  expiry_date: '',
  originating_site_block: '',
  impacted_npm: '',
  complaint_category: '',
  complaint_description: '',
  severity: '',
  suggested_next_action: '',
  initial_risk_assessment: ''
};

const DEFAULT_CHAT_HISTORY = [
  {
    role: 'assistant',
    content: 'Upload a complaint document or paste text above. I will automatically extract the details and populate the form for you.'
  }
];

// Load initial states from localStorage if available
const getSavedFormState = () => {
  try {
    const saved = localStorage.getItem('aivoa_intake_form');
    return saved ? JSON.parse(saved) : DEFAULT_FORM_STATE;
  } catch (e) {
    return DEFAULT_FORM_STATE;
  }
};

const getSavedChatHistory = () => {
  try {
    const saved = localStorage.getItem('aivoa_intake_chat_history');
    return saved ? JSON.parse(saved) : DEFAULT_CHAT_HISTORY;
  } catch (e) {
    return DEFAULT_CHAT_HISTORY;
  }
};

const getSavedActiveView = () => {
  try {
    const saved = localStorage.getItem('aivoa_active_view');
    return saved || 'intake';
  } catch (e) {
    return 'intake';
  }
};

// Form Slice to manage active user/AI inputs
const formSlice = createSlice({
  name: 'form',
  initialState: getSavedFormState(),
  reducers: {
    updateFormField: (state, action) => {
      const { field, value } = action.payload;
      if (field in state) {
        state[field] = value;
      }
    },
    setFormFields: (state, action) => {
      return { ...state, ...action.payload, status: 'Ready to Commit' };
    },
    resetForm: () => DEFAULT_FORM_STATE
  }
});

// Chat Slice to manage AI Assistant state and messaging threads
const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    history: getSavedChatHistory(),
    progress: 0,
    isPending: false,
    extractionMessage: ''
  },
  reducers: {
    addChatMessage: (state, action) => {
      state.history.push(action.payload);
    },
    setExtractionProgress: (state, action) => {
      state.progress = action.payload;
    },
    setPending: (state, action) => {
      state.isPending = action.payload;
    },
    setExtractionMessage: (state, action) => {
      state.extractionMessage = action.payload;
    },
    clearChat: (state) => {
      state.history = DEFAULT_CHAT_HISTORY;
      state.progress = 0;
      state.isPending = false;
      state.extractionMessage = '';
    }
  }
});

// View Slice to manage routing toggling between Intake and Ledger
const viewSlice = createSlice({
  name: 'view',
  initialState: {
    activeView: getSavedActiveView()
  },
  reducers: {
    setView: (state, action) => {
      state.activeView = action.payload;
    }
  }
});

// Ledger Slice to manage SQL complaints persistence history list
const ledgerSlice = createSlice({
  name: 'ledger',
  initialState: {
    records: [],
    isLoading: false,
    error: ''
  },
  reducers: {
    setLedgerRecords: (state, action) => {
      state.records = action.payload;
      state.isLoading = false;
      state.error = '';
    },
    setLedgerLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setLedgerError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    }
  }
});

// Export actions
export const { updateFormField, setFormFields, resetForm } = formSlice.actions;
export const { addChatMessage, setExtractionProgress, setPending, setExtractionMessage, clearChat } = chatSlice.actions;
export const { setView } = viewSlice.actions;
export const { setLedgerRecords, setLedgerLoading, setLedgerError } = ledgerSlice.actions;

// Configure global redux store
export const store = configureStore({
  reducer: {
    form: formSlice.reducer,
    chat: chatSlice.reducer,
    view: viewSlice.reducer,
    ledger: ledgerSlice.reducer
  }
});

// Subscribe to store updates to persist form, chat, and view states locally
store.subscribe(() => {
  try {
    const state = store.getState();
    localStorage.setItem('aivoa_intake_form', JSON.stringify(state.form));
    localStorage.setItem('aivoa_intake_chat_history', JSON.stringify(state.chat.history));
    localStorage.setItem('aivoa_active_view', state.view.activeView);
  } catch (e) {
    // Ignore localStorage block issues
  }
});
