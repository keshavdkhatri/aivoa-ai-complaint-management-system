import { configureStore, createSlice } from '@reduxjs/toolkit';

// Initial state matching the 15 schema fields across 5 sections
const initialFormState = {
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

// Form Slice to manage active user/AI inputs
const formSlice = createSlice({
  name: 'form',
  initialState: initialFormState,
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
    resetForm: () => initialFormState
  }
});

// Chat Slice to manage AI Assistant state and messaging threads
const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    history: [
      {
        role: 'assistant',
        content: 'Upload a complaint document or paste text above. I will automatically extract the details and populate the form for you.'
      }
    ],
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
      state.history = [
        {
          role: 'assistant',
          content: 'Upload a complaint document or paste text above. I will automatically extract the details and populate the form for you.'
        }
      ];
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
    activeView: 'intake' // 'intake' or 'ledger'
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
