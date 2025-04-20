// Global userData object for storing student information
const userData = {
    studentName: '',
    rollNo: '',
    year: '',
    hostelCode: '',
    memberId: null,
    phone: '',
    email: '',
    guardianName: '',
    guardianMobile: '',
    guardianEmail: '',
    relation: '',
    additionalContact1: '',
    additionalContact2: '',
    profilePicture: ''
};

// Global gate pass data counters
const gatePassData = {
    pending: 0,
    approved: 0,
    rejected: 0
};

// Array to store gate pass requests
const gatePassRequests = [];
// Store fetched gate passes for limit checking
window.currentNormalGatePasses = [];

// Add CSRF token handling
const csrftoken = 'dummy-csrf-token-for-development';

// Helper function to preserve original URL parameters
function getOriginalUrlParams() {
    const params = new URLSearchParams(window.location.search);
    // Only keep important parameters
    const importantParams = ['riderID', 'riderId', 'eventID', 'departmentID'];
    const filteredParams = new URLSearchParams();
    
    importantParams.forEach(param => {
        if (params.has(param)) {
            filteredParams.append(param, params.get(param));
        }
    });
    
    return filteredParams.toString();
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing app...');
    
    // Store original URL parameters for future use
    window.originalUrlParams = getOriginalUrlParams();
    console.log('Original URL parameters:', window.originalUrlParams);
    
    try {
    // Setup Android WebView specific functionality
    setupAndroidWebView();
    
        // Initialize UI components
    initializeUI();
    
    // Initialize modals
    initializeModals();
    
    // Initialize form controls
    initializeFormControls();
    
        // Initialize form step navigation
        console.log('Initializing form step navigation');
        initializeFormStepNavigation();
        console.log('Form step navigation initialized');
        
        // Initialize chip selection
        initializeChipSelection();
        
        // Initialize ripple effect
        initializeRippleEffect();
        
        // Initialize form validation
        initializeFormValidation();
        
        // Initialize terms checkbox
        initializeTermsCheckbox();
        
        // Initialize time inputs
        initializeTimeInputs();
        
        // Initialize status cards functionality
        initializeStatusCards();
        
        // Initialize touch interactions for mobile - COMMENTING OUT
        // initializeTouchInteractions();
    
        // Set up preview button click handler
        const previewButton = document.querySelector('.preview-btn');
        if (previewButton) {
            previewButton.addEventListener('click', function(e) {
                e.preventDefault();
                manualPreviewHandler();
            });
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('An error occurred while initializing the app. Some features may not work properly.', 'error');
    }
});

// Setup Android WebView specific functionality
function setupAndroidWebView() {
    // Try to set the status bar color (only works if the WebView allows it)
    try {
        if (window.AndroidInterface && typeof window.AndroidInterface.setStatusBarColor === 'function') {
            window.AndroidInterface.setStatusBarColor('#3b0087'); // primary-dark color
        }
    } catch (e) {
        console.log('Status bar color setting not available');
    }
    
    // Handle back button for modals (Android hardware back button)
    try {
        document.addEventListener('backbutton', handleBackButton, false);
    } catch (e) {
        console.log('Back button handling not available');
    }
    
    // REMOVED zoom prevention - let viewport meta tag handle it
    /*
    document.addEventListener('touchmove', function(event) {
        if (event.scale !== 1) {
            event.preventDefault();
        }
    }, { passive: false });
    */
}

// Handle Android back button
function handleBackButton() {
    const activeModal = document.querySelector('.modal.active');
    if (activeModal) {
        closeModal(activeModal.id);
        return false; // Prevent default back action
    }
    return true; // Allow default back action
}

// Initialize UI elements
function initializeUI() {
    // Set development mode flag for fallback behavior
    window.DEVELOPMENT_MODE = false;
    
    // Try to fetch real data first
    try {
        // Populate user data from backend API
        populateUserData();
    } catch (error) {
        console.error('Error initializing data from API, falling back to mock data:', error);
        // If API fails, use mock data
    initializeMockData();
    }
    
    // Update status card numbers
    const pendingCount = document.querySelector('.status-card.pending .status-count');
    const approvedCount = document.querySelector('.status-card.approved .status-count');
    const rejectedCount = document.querySelector('.status-card.rejected .status-count');
    
    if (pendingCount) pendingCount.textContent = gatePassData.pending;
    if (approvedCount) approvedCount.textContent = gatePassData.approved;
    if (rejectedCount) rejectedCount.textContent = gatePassData.rejected;
    
    // Initialize request cards
    initializeRequestCards();
    
    // Initialize tabs
    initializeTabs();
    
    // Update profile UI
    updateProfileUI();
}

// Initialize tab switching functionality
function initializeTabs() {
    console.log('Initializing tabs...');
    
    const tabButtons = document.querySelectorAll('.detail-tabs .tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            console.log('Switching to tab:', targetTab);
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
    
    console.log('Tabs initialized');
}

// Populate user data in profile and forms
function populateUserData() {
    // Mock profile picture URL (fallback in case API doesn't provide one)
    const mockProfilePic = "/static/images/default-profile.jpg";
    
    // Get rider_id from URL parameters (check both lowercase and uppercase variants) or Django context
    const urlParams = new URLSearchParams(window.location.search);
    const riderId = urlParams.get('riderId') || urlParams.get('riderID') || window.initialRiderId || 1477243;
    
    // Clear the rider info display
    const riderInfoElement = document.getElementById('riderInfo');
    if (riderInfoElement) {
        riderInfoElement.innerHTML = '';
    }
    
    // If no rider ID is available or it's "None" or "null", show a message and use demo mode
    if (!riderId || riderId === "None" || riderId === "null") {
        console.log('No valid rider ID provided, using demo mode');
        
        // Show login prompt in the requests container
        const container = document.getElementById('requestsContainer');
        if (container) {
            container.innerHTML = `
                <div class="no-requests-message">
                    <i class="fas fa-user-slash"></i>
                    <p>You need to log in to view your gate passes</p>
                    <button class="submit-btn ripple" onclick="window.location.href='/accounts/login/?next=/iiit/normalgatepass/'">
                        <i class="fas fa-sign-in-alt"></i> Log In
                    </button>
                </div>
            `;
        }
        
        // Set create button state
        const createBtn = document.querySelector('.create-gate-pass-btn');
        if (createBtn) {
            createBtn.classList.add('disabled');
            createBtn.onclick = () => {
                showToast('Demo mode is activated. Please log in to use the system.', 'error');
            };
        }
        
        // Set demo data for development/testing
        if (window.DEVELOPMENT_MODE) {
            userData.studentName = 'Demo Student';
            userData.rollNo = 'DEMO123';
            userData.year = 'UG2';
            userData.hostelCode = 'BH1';
            userData.phone = '9876543210';
            userData.email = 'demo@example.com';
            userData.guardianName = 'Demo Parent';
            userData.guardianMobile = '9876543210';
            userData.guardianEmail = 'demoparent@example.com';
            userData.relation = 'Father';
            updateProfileUI();
        }
        
        return;
    }
    
    console.log(`Fetching profile data for rider ID: ${riderId}`);
    
    // Call the API to get student details
    fetch(`/iiit/normal/profile/${riderId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Profile data received:', data);
            
            if (data.status === 'success') {
                // Save student data to global state
                userData.memberId = data.profile.rider_id;
                userData.studentName = data.profile.full_name;
                userData.rollNo = data.profile.roll_no;
                userData.year = data.profile.year;
                userData.hostelCode = data.profile.hostel;
                userData.phone = data.profile.phone_number;
                userData.email = data.profile.email;
                userData.guardianName = data.profile.guardian_name;
                userData.guardianMobile = data.profile.guardian_phone;
                userData.guardianEmail = data.profile.guardian_email;
                userData.relation = data.profile.relation;
                userData.profilePicture = data.profile.profile_pic || mockProfilePic;
                
                // Update UI with the new data
                updateProfileUI();
                
                // Enable create button
                const createBtn = document.querySelector('.create-gate-pass-btn');
                if (createBtn) {
                    createBtn.classList.remove('disabled');
                    createBtn.onclick = () => openModal('gatePassModal');
                }
                
                // Refresh gate pass status
                refreshGatePassStatus();
            } else {
                console.error('Failed to fetch profile:', data.message);
                showToast('Failed to fetch profile: ' + data.message, 'error');
                
                // Show login prompt
                if (riderInfoElement) {
                    riderInfoElement.innerHTML = `
                        <div class="no-requests-message">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Error loading profile data. Please try again or contact support.</p>
                        </div>
                    `;
                }
            }
        })
        .catch(error => {
            console.error('Error fetching profile:', error);
            showToast('Error fetching profile. Please try again later.', 'error');
            
            // For development, use mock data
            if (window.DEVELOPMENT_MODE) {
                try {
                    console.log('Using mock data for development');
                    userData.memberId = riderId;
                    userData.studentName = 'Demo Student';
                    userData.rollNo = 'DEMO123';
                    userData.year = 'UG2';
                    userData.hostelCode = 'BH1';
                    userData.phone = '9876543210';
                    userData.email = 'demo@example.com';
                    userData.guardianName = 'Demo Parent';
                    userData.guardianMobile = '9876543210';
                    userData.guardianEmail = 'demoparent@example.com';
                    userData.relation = 'Father';
            userData.profilePicture = mockProfilePic;
                    
            updateProfileUI();
                    
                    // Enable create button for demo
                    const createBtn = document.querySelector('.create-gate-pass-btn');
                    if (createBtn) {
                        createBtn.classList.remove('disabled');
                        createBtn.onclick = () => openModal('gatePassModal');
                    }
                } catch (uiError) {
                    console.error('Error updating UI with mock data:', uiError);
                }
            }
        });
}

// Update profile UI with user data
function updateProfileUI() {
    try {
        console.log('Updating profile UI...');
        
        // --- Populate Profile Edit Modal --- 
        
        // Set profile picture (for both header and edit modal)
        const profilePicElements = document.querySelectorAll('.user-profile-pic, .edit-profile-pic');
        if (profilePicElements) {
            profilePicElements.forEach(el => {
                if (el) el.src = userData.profilePicture || '{% static "images/default-profile.jpg" %}';
            });
        }
        
        // Update form inputs in profile edit modal
    const editName = document.getElementById('editName');
        if (editName) editName.value = userData.studentName || ''; // Use .value for inputs
        
    const editMemberId = document.getElementById('editMemberId');
        if (editMemberId) editMemberId.value = userData.memberId || '';
        
    const editPhone = document.getElementById('editPhone');
        if (editPhone) editPhone.value = userData.phone || '';
        
    const editEmail = document.getElementById('editEmail');
        if (editEmail) editEmail.value = userData.email || '';
        
        const editRollNo = document.getElementById('editRollNo');
        if (editRollNo) editRollNo.value = userData.rollNo || '';
        
        // Update year chips in edit modal
        const yearChipsContainer = document.getElementById('yearChips');
        if (yearChipsContainer && userData.year) {
            const yearChips = yearChipsContainer.querySelectorAll('.chip');
            if (yearChips && yearChips.length > 0) {
        yearChips.forEach(chip => {
                    chip.classList.remove('selected'); // Deselect all first
            if (chip.getAttribute('data-value') === userData.year) {
                chip.classList.add('selected');
                        const editYearInput = document.getElementById('editYear');
                        if (editYearInput) editYearInput.value = userData.year;
                    }
                });
            }
        }
        
        // Update hostel chips in edit modal
        const hostelChipsContainer = document.getElementById('hostelChips');
        if (hostelChipsContainer && userData.hostelCode) {
            const hostelChips = hostelChipsContainer.querySelectorAll('.chip');
            if (hostelChips && hostelChips.length > 0) {
                hostelChips.forEach(chip => {
                    chip.classList.remove('selected'); // Deselect all first
                    if (chip.getAttribute('data-value') === userData.hostelCode) {
                chip.classList.add('selected');
                        const editHostelInput = document.getElementById('editHostel');
                        if (editHostelInput) editHostelInput.value = userData.hostelCode;
                    }
                });
            }
        }
        
        // Guardian information in edit modal
        const editGuardianName = document.getElementById('editGuardianName');
        if (editGuardianName) editGuardianName.value = userData.guardianName || '';
        
        const editGuardianPhone = document.getElementById('editGuardianPhone');
        if (editGuardianPhone) editGuardianPhone.value = userData.guardianMobile || '';
        
        const editGuardianEmail = document.getElementById('editGuardianEmail');
        if (editGuardianEmail) editGuardianEmail.value = userData.guardianEmail || '';
        
        // Populate existing additional contacts in edit modal
        const additionalContainer = document.getElementById('additionalGuardiansContainer');
        if (additionalContainer) {
            additionalContainer.innerHTML = ''; // Clear existing dynamic fields first
            let count = 0;
            if (userData.additionalContact1) {
                count++;
                const group1 = document.createElement('div');
                group1.className = 'form-group additional-guardian';
                group1.innerHTML = `
                    <div class="guardian-header">
                        <label for="editAdditionalContact${count}">Additional Contact ${count}</label>
                        <button type="button" class="remove-guardian-btn" onclick="removeGuardian(this)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <input type="tel" id="editAdditionalContact${count}" name="editAdditionalContact${count}" 
                           value="${userData.additionalContact1}" placeholder="Enter 10-digit phone number" maxlength="10" required>
                `;
                additionalContainer.appendChild(group1);
            }
            if (userData.additionalContact2) {
                count++;
                const group2 = document.createElement('div');
                group2.className = 'form-group additional-guardian';
                group2.innerHTML = `
                    <div class="guardian-header">
                        <label for="editAdditionalContact${count}">Additional Contact ${count}</label>
                        <button type="button" class="remove-guardian-btn" onclick="removeGuardian(this)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <input type="tel" id="editAdditionalContact${count}" name="editAdditionalContact${count}" 
                           value="${userData.additionalContact2}" placeholder="Enter 10-digit phone number" maxlength="10" required>
                `;
                additionalContainer.appendChild(group2);
            }
        }
        
        // Set the relation chip as selected in edit modal
        if (userData.relation) {
            const relationChips = document.querySelectorAll('#relationChips .chip');
            if (relationChips && relationChips.length > 0) {
                relationChips.forEach(chip => {
                    chip.classList.remove('selected'); // Deselect all first
                    if (chip.getAttribute('data-value') === userData.relation) {
                chip.classList.add('selected');
                        const editRelationInput = document.getElementById('editRelation');
                        if (editRelationInput) editRelationInput.value = userData.relation;
            }
        });
            }
    }
    
        // --- Populate Gate Pass Request Form (Step 1) --- 
        console.log('Attempting to populate Gate Pass form fields...');
    const studentNameInput = document.getElementById('studentName');
        if (studentNameInput) {
            studentNameInput.value = userData.studentName || '';
            console.log(`SUCCESS: Set Gate Pass studentName to: ${studentNameInput.value}`);
        } else {
            console.error('ERROR: Gate Pass form field studentName not found');
        }
        
    const rollNoInput = document.getElementById('rollNo');
        if (rollNoInput) {
            rollNoInput.value = userData.rollNo || '';
            console.log(`SUCCESS: Set Gate Pass rollNo to: ${rollNoInput.value}`);
        } else {
            console.error('ERROR: Gate Pass form field rollNo not found');
        }
        
    const yearInput = document.getElementById('year');
        if (yearInput) {
            yearInput.value = userData.year || '';
            console.log(`SUCCESS: Set Gate Pass year to: ${yearInput.value}`);
        } else {
            console.error('ERROR: Gate Pass form field year not found');
        }
        
    const hostelCodeInput = document.getElementById('hostelCode');
        if (hostelCodeInput) {
            hostelCodeInput.value = userData.hostelCode || '';
            console.log(`SUCCESS: Set Gate Pass hostelCode to: ${hostelCodeInput.value}`);
        } else {
            console.error('ERROR: Gate Pass form field hostelCode not found');
        }
        
    const parentNameInput = document.getElementById('parentName');
        if (parentNameInput) {
            parentNameInput.value = userData.guardianName || '';
            console.log(`SUCCESS: Set Gate Pass parentName to: ${parentNameInput.value}`);
        } else {
            console.error('ERROR: Gate Pass form field parentName not found');
        }
        
    const relationInput = document.getElementById('relation');
        if (relationInput) {
            relationInput.value = userData.relation || '';
            console.log(`SUCCESS: Set Gate Pass relation to: ${relationInput.value}`);
        } else {
            console.error('ERROR: Gate Pass form field relation not found');
        }
        
        const parentMobileInput = document.getElementById('parentMobile');
        if (parentMobileInput) {
            parentMobileInput.value = userData.guardianMobile || '';
            console.log(`SUCCESS: Set Gate Pass parentMobile to: ${parentMobileInput.value}`);
        } else {
            console.error('ERROR: Gate Pass form field parentMobile not found');
        }
        
        console.log('Profile UI updated successfully for both modals');
    } catch (error) {
        console.error('Error updating profile UI:', error);
    }
}

// Initialize modal windows with Android-like bottom sheet behavior
function initializeModals() {
    console.log('Initializing modals...');
    
    // Add close button event listeners
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
            closeModal(modal.id);
            }
        });
    });
    
    // Add click outside to close functionality
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
    
    // Add create gate pass button listener
    const createGatePassBtn = document.querySelector('.create-gate-pass-btn');
    if (createGatePassBtn) {
        createGatePassBtn.addEventListener('click', function() {
            if (!this.classList.contains('disabled')) {
                openModal('gatePassModal');
                // Reset form, set default times and update guardian details
                if (document.getElementById('gatePassForm')) {
                    document.getElementById('gatePassForm').reset();
                    setDefaultTimes();
                    updateGuardianDetails();
                }
            } else {
                showToast('Please log in to create a gate pass.', 'error');
            }
        });
    }
    
    console.log('Modals initialized');
}

// Open modal function
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
    modal.classList.add('active');
        
        // If opening the Gate Pass modal, ensure its fields are populated
        if (modalId === 'gatePassModal') {
            console.log('Opening Gate Pass modal, explicitly populating fields...');
            // Ensure userData is available before trying to populate
            if (userData && userData.memberId) { 
                populateGatePassFormFields();
            } else {
                console.warn('User data not available when opening gate pass modal.');
                // Optionally show a message or handle the case where data isn't ready
            }
        }
        // Remove body class addition since we don't want scroll lock
    }
}

// Function specifically to populate Gate Pass Form (Step 1) fields
function populateGatePassFormFields() {
    console.log('Running populateGatePassFormFields...');
    try {
        const studentNameInput = document.getElementById('studentName');
        if (studentNameInput) studentNameInput.value = userData.studentName || '';
        
        const rollNoInput = document.getElementById('rollNo');
        if (rollNoInput) rollNoInput.value = userData.rollNo || '';
        
        const yearInput = document.getElementById('year');
        if (yearInput) yearInput.value = userData.year || '';
        
        const hostelCodeInput = document.getElementById('hostelCode');
        if (hostelCodeInput) hostelCodeInput.value = userData.hostelCode || '';
        
        const parentNameInput = document.getElementById('parentName');
        if (parentNameInput) parentNameInput.value = userData.guardianName || '';
        
        const relationInput = document.getElementById('relation');
        if (relationInput) relationInput.value = userData.relation || '';
        
        const parentMobileInput = document.getElementById('parentMobile');
        if (parentMobileInput) parentMobileInput.value = userData.guardianMobile || '';
        
        console.log('Gate Pass form fields populated.');
    } catch (error) {
        console.error('Error populating Gate Pass form fields:', error);
    }
}

// Close modal function
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        
        // For profile edit modal, restore original URL parameters
        if (modalId === 'profileEditModal' && window.originalUrlParams) {
            // Restore URL without page reload
            const newUrl = window.location.pathname + (window.originalUrlParams ? '?' + window.originalUrlParams : '');
            history.replaceState(null, document.title, newUrl);
            console.log('Restored original URL parameters:', window.originalUrlParams);
        }
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        const modalId = e.target.id;
        closeModal(modalId);
    }
});

// Close modal when clicking close button
document.querySelectorAll('.modal-close').forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        if (modal) {
            closeModal(modal.id);
        }
    });
});

// Open modals
document.querySelectorAll('[data-modal-target]').forEach(trigger => {
    trigger.addEventListener('click', () => {
        const modalId = trigger.dataset.modalTarget;
        openModal(modalId);
    });
});

// Initialize form controls for mobile input
function initializeFormControls() {
    // Set default times rounded to nearest 30 minutes
    setDefaultTimes();
    
    // Initialize chip selection
    initializeChipSelection();
    
    // Initialize file upload for mobile (if exists - not in normalgatepass)
    const fileInput = document.getElementById('documentUpload');
    const fileLabel = document.querySelector('.upload-container .upload-label');
    const uploadContainer = document.querySelector('.upload-container');
    
    if (uploadContainer && fileInput) {
    uploadContainer.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;
            fileLabel.textContent = fileName.length > 25 ? fileName.substring(0, 22) + '...' : fileName;
            uploadContainer.classList.add('has-file');
        } else {
            fileLabel.textContent = 'Drop files here or tap to upload';
            uploadContainer.classList.remove('has-file');
        }
    });
    }

    // Initialize Add Guardian Button functionality in Profile Edit Modal
    const addGuardianBtn = document.getElementById('addGuardianBtn');
    const additionalGuardiansContainer = document.getElementById('additionalGuardiansContainer');
    let guardianCount = 0; // Start count for dynamic fields

    if (addGuardianBtn && additionalGuardiansContainer) {
        addGuardianBtn.addEventListener('click', () => {
            // Limit to 2 additional numbers (total 3 including primary)
            const existingAdditional = additionalGuardiansContainer.querySelectorAll('.additional-guardian').length;
            if (existingAdditional >= 2) {
                showToast('You can add a maximum of two additional numbers.', 'warning');
                return;
            }
            
            guardianCount = existingAdditional + 1;
            
            const newGuardianGroup = document.createElement('div');
            newGuardianGroup.className = 'form-group additional-guardian';
            newGuardianGroup.innerHTML = `
                <div class="guardian-header">
                    <label for="editAdditionalContact${guardianCount}">Additional Contact ${guardianCount}</label>
                    <button type="button" class="remove-guardian-btn" onclick="removeGuardian(this)">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <input type="tel" id="editAdditionalContact${guardianCount}" name="editAdditionalContact${guardianCount}" 
                       placeholder="Enter 10-digit phone number" maxlength="10" required>
            `;
            additionalGuardiansContainer.appendChild(newGuardianGroup);
        });
    } else {
        console.warn('Add Guardian button or container not found in the profile modal.');
    }
}

// Function to remove additional guardian
function removeGuardian(button) {
    const guardianGroup = button.closest('.additional-guardian');
    if (guardianGroup && guardianGroup.parentNode) {
        guardianGroup.parentNode.removeChild(guardianGroup);
        // Optionally, re-index remaining additional contacts if needed
    }
}

// Add styles for the new elements
document.head.insertAdjacentHTML('beforeend', `
    <style>
        .additional-guardian {
            position: relative;
            margin-bottom: 16px;
            padding: 16px;
            background: #f5f5f5;
            border-radius: 8px;
        }

        .guardian-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .remove-guardian-btn {
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
            padding: 4px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }

        .remove-guardian-btn:hover {
            background: #e0e0e0;
            color: #333;
        }

        .additional-guardian input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
    </style>
`);

// Initialize form step navigation
function initializeFormStepNavigation() {
    console.log('Initializing form step navigation');
    
    const stepIndicators = document.querySelectorAll('.step-indicator');
    const formSteps = document.querySelectorAll('.form-step');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const previewButton = document.querySelector('.preview-btn');
    
    console.log('Navigation elements found:', {
        stepIndicators: stepIndicators.length,
        formSteps: formSteps.length,
        nextButtons: nextButtons.length,
        prevButtons: prevButtons.length,
        previewButton: previewButton ? 'found' : 'not found'
    });
    
    // Step indicators click handling
    stepIndicators.forEach(indicator => {
        indicator.addEventListener('click', () => {
            const targetStep = indicator.getAttribute('data-step');
            
            // Only allow navigating to completed steps or the current active step + 1
            const currentActive = document.querySelector('.step-indicator.active');
            const currentStep = parseInt(currentActive.getAttribute('data-step'));
            const clickedStep = parseInt(targetStep);
            
            if (clickedStep < currentStep || 
                clickedStep === currentStep || 
                (clickedStep === currentStep + 1 && validateCurrentStep(currentStep))) {
                navigateToStep(targetStep);
                
                // If moving to preview step, update preview
                if (targetStep === '3') {
                    console.log('Step indicator clicked for step 3, generating preview');
                    generatePreview();
                }
            } else if (clickedStep > currentStep) {
                showToast('Please complete the current step first', 'error');
            }
        });
    });
    
    // Next button click handling
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            const currentStep = parseInt(button.closest('.form-step').getAttribute('data-step'));
            const nextStep = (currentStep + 1).toString();
            
            if (validateCurrentStep(currentStep)) {
                navigateToStep(nextStep);
            }
        });
    });
    
    // Preview button click handling
    if (previewButton) {
        console.log('Adding click handler to preview button');
        previewButton.addEventListener('click', (e) => {
                try {
                console.log('Preview button clicked');
                if (validateCurrentStep(2)) {
                    navigateToStep('3');
                    generatePreview();
                }
                } catch (error) {
                console.error('Error in preview button handler:', error);
            }
        });
    }
    
    // Previous button click handling
    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            const currentStep = parseInt(button.closest('.form-step').getAttribute('data-step'));
            const prevStep = (currentStep - 1).toString();
                navigateToStep(prevStep);
        });
    });
    
    console.log('Form step navigation initialized');
}

// Navigate to a specific step
function navigateToStep(stepNumber) {
    console.log('Navigating to step:', stepNumber);
    
    // Update step indicators
    const stepIndicators = document.querySelectorAll('.step-indicator');
    stepIndicators.forEach(indicator => {
        const indicatorStep = parseInt(indicator.getAttribute('data-step'));
        
        indicator.classList.remove('active', 'completed');
        
        if (indicatorStep < stepNumber) {
            indicator.classList.add('completed');
        } else if (indicatorStep == stepNumber) {
            indicator.classList.add('active');
        }
    });
    
    // Update form steps visibility
    const formSteps = document.querySelectorAll('.form-step');
    formSteps.forEach(step => {
        if (step.getAttribute('data-step') === stepNumber) {
            step.classList.add('active');
            
            // If this is step 3, generate the preview
            if (stepNumber === '3') {
                generatePreview();
            }
        } else {
            step.classList.remove('active');
        }
    });
    
    // Add haptic feedback if available
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(5);
    }
}

// Validate the current step
function validateCurrentStep(stepNumber) {
    console.log('Validating step:', stepNumber);
    
    // Clear previous error messages
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.remove());
    
    // Remove error class from all inputs
    const inputs = document.querySelectorAll('.error');
    inputs.forEach(input => input.classList.remove('error'));
    
    // Variables for validation
    let isValid = true;
    let firstError = null;
    
    // Get all inputs in the current step
    const currentStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    
    // Step 1 validation - Student Information
    if (stepNumber === 1) {
        // Student info is pre-filled and readonly, so it's valid
        isValid = true;
    }
    
    // Step 2 validation - Leave Details
    if (stepNumber === 2) {
        const leaveTime = document.getElementById('leaveTime');
        const returnTime = document.getElementById('returnTime');
        const destination = document.getElementById('destination');
        const purpose = document.getElementById('purpose');
        const termsAgreement = document.getElementById('termsAgreement');
        
        // Validate leave time
        if (!leaveTime.value) {
            isValid = false;
            firstError = leaveTime;
            showError(leaveTime, 'Please select a leave time');
        } else {
            const [hours] = leaveTime.value.split(':').map(Number);
            if (hours < 6) {
                isValid = false;
                firstError = leaveTime;
                showError(leaveTime, 'Leave time must be after 6:00 AM');
            }
        }
        
        // Validate return time
        if (!returnTime.value) {
            isValid = false;
            firstError = firstError || returnTime;
            showError(returnTime, 'Please select a return time');
        } else {
            const [returnHours] = returnTime.value.split(':').map(Number);
            
            if (returnHours >= 21) {
            isValid = false;
                firstError = firstError || returnTime;
                showError(returnTime, 'Return time must be before 9:00 PM');
            } else {
                const leaveTimeValue = leaveTime.value;
                const returnTimeValue = returnTime.value;
                
                const [leaveHours, leaveMinutes] = leaveTimeValue.split(':').map(Number);
                const [, returnMinutes] = returnTimeValue.split(':').map(Number);
                
                const leaveMinutesTotal = leaveHours * 60 + leaveMinutes;
                const returnMinutesTotal = returnHours * 60 + returnMinutes;
                
                if (returnMinutesTotal <= leaveMinutesTotal) {
                isValid = false;
                    firstError = firstError || returnTime;
                    showError(returnTime, 'Return time must be after leave time');
            }
        }
        }
        
        // Validate destination
        if (!destination.value.trim()) {
            isValid = false;
            firstError = firstError || destination;
            showError(destination, 'Please enter a destination');
        }
        
        // Validate purpose
        if (!purpose.value.trim()) {
            isValid = false;
            firstError = firstError || purpose;
            showError(purpose, 'Please describe the purpose of your visit');
        }
        
        // Validate terms agreement
        if (!termsAgreement.checked) {
                isValid = false;
            firstError = firstError || termsAgreement;
            showError(termsAgreement, 'You must agree to the terms and conditions');
        }
    }
    
    // If there's an error, scroll to it
    if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    return isValid;
}

// Initialize chip selection for Year, Relation, and Transport
function initializeChipSelection() {
    try {
    console.log('Initializing chip selection...');
    
        // --- Year Chips --- 
        const yearChipsContainer = document.getElementById('yearChips');
        if (yearChipsContainer) {
            const yearChips = yearChipsContainer.querySelectorAll('.chip');
            const yearInput = document.getElementById('editYear'); // Hidden input for year
            
            if (yearChips && yearChips.length > 0 && yearInput) {
                yearChips.forEach(chip => {
                    chip.addEventListener('click', function() {
                        try {
                            yearChips.forEach(c => c.classList.remove('selected'));
                            this.classList.add('selected');
                            yearInput.value = this.getAttribute('data-value');
                            console.log(`Year set to: ${yearInput.value}`);
                        } catch (e) {
                            console.error('Error in year chip click handler:', e);
                        }
                    });
                });
                console.log('Year chips initialized with', yearChips.length, 'options');
            } else {
                console.warn('Year chips or input element not found properly in profile modal.');
            }
        } else {
            console.warn('Year chips container (#yearChips) not found in profile modal.');
        }
        // --- End Year Chips --- 

        // Relation chips in profile edit modal
        const relationChipsContainer = document.getElementById('relationChips');
        if (relationChipsContainer) {
            const relationChips = relationChipsContainer.querySelectorAll('.chip');
    const relationInput = document.getElementById('editRelation');
    
            if (relationChips && relationChips.length > 0 && relationInput) {
                // Add click event to each relation chip
        relationChips.forEach(chip => {
                    chip.addEventListener('click', function() {
                        try {
                            // Remove selected class from all chips
                relationChips.forEach(c => c.classList.remove('selected'));
                            
                            // Add selected class to clicked chip
                            this.classList.add('selected');
                            
                            // Update hidden input with selected value
                            relationInput.value = this.getAttribute('data-value');
                        } catch (e) {
                            console.error('Error in chip click handler:', e);
                        }
            });
        });
                console.log('Relation chips initialized with', relationChips.length, 'options');
            } else {
                console.warn('Relation chips or input element not found properly');
            }
        } else {
            console.warn('Relation chips container not found');
        }
        
        // Transport chips in Gate Pass modal
        const transportChipsContainer = document.getElementById('transportChips');
        if (transportChipsContainer) {
            const transportChips = transportChipsContainer.querySelectorAll('.chip');
            const transportInput = document.getElementById('transport'); // Hidden input

            if (transportChips && transportChips.length > 0 && transportInput) {
                // Add click event to each transport chip
        transportChips.forEach(chip => {
                    chip.addEventListener('click', function() {
                        try {
                transportChips.forEach(c => c.classList.remove('selected'));
                            this.classList.add('selected');
                            transportInput.value = this.getAttribute('data-value');
                            console.log(`Transport set to: ${transportInput.value}`);
                        } catch (e) {
                            console.error('Error in transport chip click handler:', e);
                        }
            });
        });
                console.log('Transport chips initialized with', transportChips.length, 'options');
            } else {
                console.warn('Transport chips or input element not found properly');
            }
        } else {
            console.warn('Transport chips container not found');
        }

        console.log('Chip selection initialization completed');
    } catch (error) {
        console.error('Error initializing chip selection:', error);
    }
}

// Generate preview content
function generatePreview() {
    console.log('Generating preview...');
    
    const previewContainer = document.getElementById('previewContainer');
    if (!previewContainer) return;
    
    // Get form values
    const destination = document.getElementById('destination')?.value || '';
    const purpose = document.getElementById('purpose')?.value || '';
    const leaveTime = document.getElementById('leaveTime')?.value || '';
    const returnTime = document.getElementById('returnTime')?.value || '';
    const transportMode = document.querySelector('input[name="transportMode"]:checked')?.value || '';
    
    // Format date and time for display
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Create HTML for preview
    let previewHtml = `
        <div class="preview-card">
            <div class="preview-card-header">
                <i class="fas fa-user-graduate"></i>
                Student Details
            </div>
            <div class="preview-details">
                <span class="preview-label">Name:</span>
                <span class="preview-value">${userData.studentName || 'Not available'}</span>
                
                <span class="preview-label">Roll No:</span>
                <span class="preview-value">${userData.rollNo || 'Not available'}</span>
                
                <span class="preview-label">Year & Hostel:</span>
                <span class="preview-value">${userData.year || 'Not available'} - ${userData.hostelCode || 'Not available'}</span>
            </div>
        </div>
        
        <div class="preview-card">
            <div class="preview-card-header">
                <i class="fas fa-user-shield"></i>
                Guardian Details
            </div>
            <div class="preview-details">
                <span class="preview-label">Name:</span>
                <span class="preview-value">${userData.guardianName || 'Not available'}</span>
                
                <span class="preview-label">Relation:</span>
                <span class="preview-value">${userData.relation || 'Not available'}</span>
                
                <span class="preview-label">Mobile:</span>
                <span class="preview-value">${userData.guardianMobile || 'Not available'}</span>
            </div>
        </div>
        
        <div class="preview-card">
            <div class="preview-card-header">
                <i class="fas fa-clock"></i>
                Leave Details
            </div>
            <div class="preview-details">
                <span class="preview-label">Date:</span>
                <span class="preview-value">${formattedDate}</span>
                
                <span class="preview-label">Leave Time:</span>
                <span class="preview-value">${formatTimeForDisplay(leaveTime)}</span>
                
                <span class="preview-label">Return Time:</span>
                <span class="preview-value">${formatTimeForDisplay(returnTime)}</span>
                
                <span class="preview-label">Destination:</span>
                <span class="preview-value">${destination}</span>
                
                <span class="preview-label">Purpose:</span>
                <span class="preview-value">${purpose}</span>
                
                <span class="preview-label">Transport:</span>
                <span class="preview-value">${transportMode}</span>
            </div>
        </div>
    `;
    
    // Set the preview HTML
    previewContainer.innerHTML = previewHtml;
}

// Function to update guardian fields in the gate pass modal
function updateGuardianDetails() {
    try {
        console.log('Updating guardian details in form...');
        
        // Update the guardian details tab with user data
        const guardianName = document.getElementById('guardianName');
        const guardianRelation = document.getElementById('guardianRelation');
        const guardianPhone = document.getElementById('guardianPhone');
        const guardianEmail = document.getElementById('guardianEmail');
        
        // Only update if elements exist
        if (guardianName) guardianName.value = userData.guardianName || '';
        if (guardianRelation) guardianRelation.value = userData.relation || '';
        if (guardianPhone) guardianPhone.value = userData.guardianMobile || '';
        if (guardianEmail) guardianEmail.value = userData.guardianEmail || '';
        
        console.log('Guardian details updated successfully');
    } catch (error) {
        console.error('Error updating guardian details:', error);
    }
}

// Helper function to format date
function formatDateForDisplay(dateStr) {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Format time string (HH:MM:SS or HH:MM) to HH:MM AM/PM
function formatTimeForDisplay(timeStr) {
    if (!timeStr) {
        // If timeStr is null, undefined, or empty, return a placeholder or empty string
        return 'N/A'; // Or return '';
    }
    try {
        // Assuming timeStr is in "HH:MM:SS" or "HH:MM" format
        const [hours, minutes] = timeStr.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
        const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
    } catch (error) {
        console.error(`Error formatting time string '${timeStr}':`, error);
        return timeStr; // Return original string if formatting fails
    }
}

// Initialize request cards
function initializeRequestCards() {
    const requestsContainer = document.getElementById('requestsContainer');
    
    // Clear any existing cards
    requestsContainer.innerHTML = '';
    
    // Check if there are any requests
    if (gatePassRequests.length === 0) {
        const noRequestsMessage = document.createElement('div');
        noRequestsMessage.className = 'no-requests-message';
        noRequestsMessage.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <p>No gate pass requests found</p>
        `;
        requestsContainer.appendChild(noRequestsMessage);
        return;
    }
    
    // Create card for each request
    gatePassRequests.forEach(request => {
        // Format dates and times
        const leaveDate = formatDate(request.leaveDate);
        const returnDate = formatDate(request.returnDate);
        
        // Extract time information
        const leaveTime = formatTime(request.leaveDate);
        const returnTime = formatTime(request.returnDate);
        
        // Create card
        const card = document.createElement('div');
        card.className = 'request-card ripple';
        card.setAttribute('data-request-id', request.id);
        
        // Set card content
        card.innerHTML = `
            <div class="request-header">
                <div class="request-destination">${request.destination}</div>
                <div class="request-status ${request.status}">${getStatusText(request.status)}</div>
                ${request.status === 'in-progress' ? 
                    `<div class="delete-icon" title="Delete Request">
                        <i class="far fa-trash-can"></i>
                     </div>` : ''}
            </div>
            <div class="request-dates">
                <div class="date-group">
                    <div class="date-label">Leaving</div>
                    <div class="date-value">${leaveDate}</div>
                    <div class="time-value">${leaveTime}</div>
                </div>
                <div class="date-divider">
                    ${request.status === 'in-progress' ? '<div class="status-badge in-progress">In Progress</div>' : ''}
                </div>
                <div class="date-group">
                    <div class="date-label">Returning</div>
                    <div class="date-value">${returnDate}</div>
                    <div class="time-value">${returnTime}</div>
                </div>
            </div>
        `;
        
        // Add to container
        requestsContainer.appendChild(card);
        
        // Add click event to show status detail
        card.addEventListener('click', (e) => {
            // Don't trigger card click if delete icon was clicked
            if (e.target.closest('.delete-icon')) {
                return;
            }
            showStatusDetail(request);
        });
        
        // Add click event for delete icon if present
        const deleteIcon = card.querySelector('.delete-icon');
        if (deleteIcon) {
            deleteIcon.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click event
                confirmDeleteRequest(request.id);
            });
        }
    });
}

// Format date for display
function formatDate(date) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Format time for display
function formatTime(date) {
    const options = { hour: '2-digit', minute: '2-digit', hour12: true };
    return date.toLocaleTimeString('en-US', options);
}

// Get status text based on numeric code
function getStatusText(statusCode) {
    switch (statusCode) {
        case 0: return 'Pending';
        case 1: return 'Approved';       // Changed from 'Currently Out'
        case 2: return 'Currently Out';  // New case
        case 3: return 'Rejected';
        case 4: return 'Returned';       // New case
        case 5: return 'Defaulter'; // Added case for Defaulter
        default: 
            console.warn(`Unknown status code received: ${statusCode}`);
            return 'Unknown';
    }
}

// Show status detail modal
function showStatusDetail(request) {
    try {
        console.log('Showing status detail for request object:', JSON.stringify(request, null, 2)); 
    const modal = document.getElementById('statusDetailModal');
        if (!modal) {
            console.error('Status Detail Modal not found');
            return;
        }

        // --- Populate Basic Details --- 
        const detailDestination = document.getElementById('detailDestination');
        const detailLeaveDate = document.getElementById('detailLeaveDate');
        const detailLeaveTime = document.getElementById('detailLeaveTime');
        const detailReturnDate = document.getElementById('detailReturnDate');
        const detailReturnTime = document.getElementById('detailReturnTime');
        const requestId = document.getElementById('requestId');
        const submittedDate = document.getElementById('submittedDate');
        const currentStatus = document.getElementById('currentStatus');

        if (detailDestination) detailDestination.textContent = request.destination || 'N/A';
        
        // Assuming leave/return dates are always today for normal gate pass
        // If backend provides created_at, use that to determine 'Today' or specific date
        let displayDateStr = 'Today';
        if (request.created_at) { 
            const requestDate = new Date(request.created_at).toDateString();
            const todayDate = new Date().toDateString();
            if (requestDate !== todayDate) {
                displayDateStr = new Date(request.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
        }
        
        if (detailLeaveDate) detailLeaveDate.textContent = displayDateStr;
        if (detailReturnDate) detailReturnDate.textContent = displayDateStr;
        // Use correct snake_case property names from the request object
        if (detailLeaveTime) detailLeaveTime.textContent = formatTimeForDisplay(request.leave_time) || 'N/A'; 
        if (detailReturnTime) detailReturnTime.textContent = formatTimeForDisplay(request.return_time) || 'N/A';
        
        if (requestId) requestId.textContent = request.id || 'N/A';
        
        // --- NEW: Populate Submitted On Date --- 
        if (submittedDate && request.created_at) { 
            try {
                submittedDate.textContent = new Date(request.created_at).toLocaleString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric', 
                    hour: 'numeric', minute: '2-digit', hour12: true,
                    timeZone: 'Asia/Kolkata' // Specify IST timezone
                });
            } catch (e) { 
                console.error("Error formatting submitted date:", request.created_at, e);
                submittedDate.textContent = 'Invalid Date'; 
            }
        } else if (submittedDate) {
            submittedDate.textContent = 'N/A';
        }
        // --- END NEW ---

        // --- Update Status Text --- 
        let statusText = 'Unknown'; 
        const statusCode = request.status_code; 
        console.log(`Using request.status_code: ${statusCode} (Type: ${typeof statusCode})`);
        
        // Use the updated getStatusText function
        statusText = getStatusText(statusCode);

        // REMOVED logic that appended reason to statusText
        /*
        if (statusCode === 3) { // If rejected, check for reason
            isRejected = true;
            if (request.rejection_reason) {
                const reason = String(request.rejection_reason).trim(); 
                if (reason) {
                    statusText += `: ${reason}`;
                }
            }
        }
        */
        
        console.log('Determined statusText:', statusText);
        const currentStatusElement = document.getElementById('currentStatus');
        if (currentStatusElement) currentStatusElement.textContent = statusText;

        // --- Handle Rejection Reason Display ---
        const rejectionReasonSection = document.getElementById('rejectionReasonSection');
        const rejectionReasonText = document.getElementById('rejectionReasonText');

        if (rejectionReasonSection && rejectionReasonText) {
            if (statusCode === 3 && request.rejection_reason && String(request.rejection_reason).trim()) {
                rejectionReasonText.textContent = String(request.rejection_reason).trim();
                rejectionReasonSection.style.display = 'flex'; // Show the reason section
                console.log('Rejection reason displayed:', request.rejection_reason);
            } else {
                rejectionReasonSection.style.display = 'none'; // Hide if not rejected or no reason
                rejectionReasonText.textContent = ''; // Clear previous reason
            }
        } else {
            console.error('Rejection reason elements not found in the modal.');
        }
        
        // --- Update the Timeline --- 
        updateNormalTimeline(statusCode, request.final_action_by_role); // Pass the numeric code AND the role

        // --- Update QR Code --- 
    const qrActive = document.getElementById('qrCodeActive');
    const qrDisabled = document.getElementById('qrCodeDisabled');
    const qrInstructions = document.getElementById('qrInstructions');
        const qrImg = qrActive ? qrActive.querySelector('img') : null;

        if (qrActive && qrDisabled && qrInstructions && qrImg) {
            // Show QR only if status is Approved (1) or Currently Out (2)
            if (statusCode === 1 || statusCode === 2) { 
                qrActive.style.display = 'block';
        qrDisabled.style.display = 'none';
        qrInstructions.textContent = 'Present this QR code at the gate for scanning.';
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(request.id)}`;
                qrImg.alt = `QR Code for Gate Pass ${request.id}`;
            } else { // Pending, Rejected, Returned
                qrActive.style.display = 'none';
        qrDisabled.style.display = 'flex';
                if (statusCode === 4) { // Returned
                    qrInstructions.textContent = 'Gate pass already used.';
                    qrDisabled.querySelector('p').textContent = 'Returned';
                } else { // Pending (0) or Unknown
                    qrInstructions.textContent = 'QR code will be available after approval.';
                    qrDisabled.querySelector('p').textContent = 'Pending';
                }
            }
        }
    
    openModal(modal.id);
    } catch (error) {
        console.error('Error in showStatusDetail:', error);
        showToast('Could not display gate pass details.', 'error');
    }
}

// Format date and time
function formatDateTime(date) {
    const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    
    return `${date.toLocaleDateString('en-US', dateOptions)} - ${date.toLocaleTimeString('en-US', timeOptions)}`;
}

// Get current status text based on step
function getCurrentStatusText(request) {
    if (request.status === 'rejected') {
        return 'Request rejected';
    }
    
    if (request.status === 'approved') {
        return 'Currently Out';
    }
    
    const stepTexts = [
        'Submitted and awaiting processing',
        'Awaiting parent',
        'Awaiting admin',
        'Security verification pending',
        'Currently Out'
    ];
    
    return stepTexts[request.currentStep - 1];
}

// Update timeline
function updateTimeline(currentStep) {
    // Update progress bar - now with 5 steps instead of 4
    const progressPercentage = ((currentStep - 1) / 4) * 100;
    const progressBar = document.getElementById('approvalProgress');
    if (progressBar) {
    progressBar.style.width = `${progressPercentage}%`;
    }
    
    // Update step indicators
    const steps = document.querySelectorAll('.timeline-step');
    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        
        // Remove all classes first
        step.classList.remove('completed', 'active');
        
        if (stepNumber < currentStep) {
            step.classList.add('completed');
        } else if (stepNumber === currentStep) {
            step.classList.add('active');
        }
    });
}

// Set default times rounded to nearest 30 minutes
function setDefaultTimes() {
    const leaveTimeInput = document.getElementById('leaveTime');
    const returnTimeInput = document.getElementById('returnTime');
    
    if (!leaveTimeInput || !returnTimeInput) {
        console.error("Time input elements not found");
        return;
    }
    
    // Set minimum time for leave time to 6:00 AM
    leaveTimeInput.min = '06:00';
    
    // Set maximum time for return time to 9:00 PM (21:00)
    returnTimeInput.max = '21:00';
    
    // Set default leave time to 6:00 AM
    leaveTimeInput.value = '06:00';
    
    // Set default return time to 9:00 PM
    returnTimeInput.value = '21:00';
    
    // Add event listener for leave time validation
    leaveTimeInput.addEventListener('change', function() {
        // Remove any existing error messages first
        removeErrorMessage(this);
        
        const selectedTime = this.value;
        const [hours] = selectedTime.split(':').map(Number);
        
        if (hours < 6) {
            showError(this, 'Leave time must be after 6:00 AM');
            this.value = '06:00';
        }
    });
    
    // Add event listener for return time validation
    returnTimeInput.addEventListener('change', function() {
        // Remove any existing error messages first
        removeErrorMessage(this);
        
        const leaveTime = leaveTimeInput.value;
        const returnTime = this.value;
        
        const [leaveHours, leaveMinutes] = leaveTime.split(':').map(Number);
        const [returnHours, returnMinutes] = returnTime.split(':').map(Number);
        
        const leaveMinutesTotal = leaveHours * 60 + leaveMinutes;
        const returnMinutesTotal = returnHours * 60 + returnMinutes;
        
        if (returnMinutesTotal <= leaveMinutesTotal) {
            showError(this, 'Return time must be after leave time');
            // Set return time to 9:00 PM
            this.value = '21:00';
        } else if (returnHours >= 21) {
            showError(this, 'Return time must be before 9:00 PM');
            this.value = '21:00';
        }
    });
}

// Helper function to remove existing error messages
function removeErrorMessage(element) {
    const errorMessage = element.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
    element.classList.remove('error');
}

// Helper function to show input error
function showError(element, message) {
    // Remove any existing error messages first
    removeErrorMessage(element);
    
    // Add error class and message
    element.classList.add('error');
    const errorSpan = document.createElement('span');
    errorSpan.className = 'error-message';
    errorSpan.textContent = message;
    element.parentNode.appendChild(errorSpan);
    
    // Add shake animation for better feedback
    element.animate(
        [
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(0)' }
        ],
        {
            duration: 400,
            easing: 'ease-in-out'
        }
    );
}

// Initialize form validation
function initializeFormValidation() {
    console.log('Initializing form validation...');
    
    const form = document.getElementById('gatePassForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate required fields
        const requiredFields = {
            'leaveTime': 'Leave time is required',
            'returnTime': 'Return time is required',
            'destination': 'Destination is required',
            'purpose': 'Purpose is required',
            'transport': 'Mode of transport is required',
            'termsAgreement': 'You must agree to the terms and conditions'
        };
        
        let isValid = true;
        let firstInvalidField = null;
        
        // Check each required field
        for (const [fieldId, errorMessage] of Object.entries(requiredFields)) {
            const field = document.getElementById(fieldId);
            const errorElement = document.getElementById(`${fieldId}-error`);
            
            // Remove any existing error styling/messages
            if (field) {
                field.classList.remove('error');
                if (errorElement) errorElement.remove();
            }
            
            // Check if the field exists and has a value
            if (field && !field.value) {
                isValid = false;
                
                // Add error styling
                field.classList.add('error');
                
                // Add error message
                const errorDiv = document.createElement('div');
                errorDiv.id = `${fieldId}-error`;
                errorDiv.className = 'error-message';
                errorDiv.textContent = errorMessage;
                
                // Insert after the field
                if (field.parentNode) {
                    field.parentNode.insertBefore(errorDiv, field.nextSibling);
                }
                
                // Track the first invalid field to focus on it
                if (!firstInvalidField) {
                    firstInvalidField = field;
                }
            }
        }
        
        // If validation fails, focus the first invalid field and stop
        if (!isValid) {
            if (firstInvalidField) {
                firstInvalidField.focus();
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        
        // If validation passes, submit the form
                submitGatePass();
            });
}

// Submit gate pass
function submitGatePass() {
    console.log('Submitting gate pass request...');
    const submitBtn = document.querySelector('.form-step[data-step="3"] .submit-btn');
    let originalButtonText = 'Submit Request'; // Default text

    if (submitBtn) {
        originalButtonText = submitBtn.textContent.trim(); // Get actual text before disabling
    } else {
        console.error("Submit button in preview step not found!");
        showToast('Could not find submit button.', 'error');
        return; // Don't proceed if button isn't found
    }

    try {
        // --- Check Daily Limit FIRST ---
        if (!checkGatePassLimit()) {
            console.log('Gate pass limit reached. Submission halted.');
            // Close the modal maybe?
             closeModal('gatePassModal');
            return; // Stop submission
        }
        // -------------------------------

        // Check if user data is available
        if (!userData.memberId || userData.memberId === "None" || userData.memberId === "null") {
            // Try to get rider_id from URL parameters as fallback
            const urlParams = new URLSearchParams(window.location.search);
            const riderId = urlParams.get('riderId') || urlParams.get('riderID') || window.initialRiderId;
            
            if (!riderId || riderId === "None" || riderId === "null") {
                console.error('No member ID available. Please log in or complete your profile.');
                showToast('Please log in or complete your profile before submitting a gate pass request.', 'error');
                
                // Close the modal
                closeModal('gatePassModal');
                return;
            }
            
            // Use the rider ID from URL as fallback
            userData.memberId = riderId;
            console.log('Using rider ID from URL as fallback:', riderId);
        }

        // Get form elements
        const formElements = {
            leaveTime: document.getElementById('leaveTime'),
            returnTime: document.getElementById('returnTime'),
            destination: document.getElementById('destination'),
            purpose: document.getElementById('purpose'),
            transportMode: document.getElementById('transport') // Get value from the hidden input for chips
        };

        console.log('Form elements:', formElements);
        
        // Check if form elements exist (especially transport which relies on chips)
        for (const [key, element] of Object.entries(formElements)) {
            if (!element) {
                console.error(`Form element ${key} not found`);
                showToast(`Missing form field: ${key}. Please complete all fields.`, 'error');
                return;
            }
        }
        
        // Special validation for transportMode hidden input
        if (formElements.transportMode && !formElements.transportMode.value) {
             console.error('Transport mode is required');
             showToast('Please select a mode of transport', 'error');
             // Potentially highlight the chip group or show error near it
             const transportChipGroup = document.getElementById('transportChips');
             if (transportChipGroup) {
                 transportChipGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 // Add a visual cue if possible
             }
             return;
        }

        // Form validation (other fields)
        if (!formElements.leaveTime.value) {
            console.error('Leave time is required');
            showToast('Please select a leave time', 'error');
            return;
        }
        
        if (!formElements.returnTime.value) {
            console.error('Return time is required');
            showToast('Please select a return time', 'error');
            return;
        }
        
        if (!formElements.destination.value.trim()) {
            console.error('Destination is required');
            showToast('Please enter a destination', 'error');
            return;
        }
        
        if (!formElements.purpose.value.trim()) {
            console.error('Purpose is required');
            showToast('Please enter a purpose', 'error');
            return;
        }
        
        // Validate time range
        const leaveTime = formElements.leaveTime.value;
        const returnTime = formElements.returnTime.value;
        
        // Convert times to 24-hour format for comparison
        const leaveHour = parseInt(leaveTime.split(':')[0]);
        const returnHour = parseInt(returnTime.split(':')[0]);
        
        if (leaveHour < 6) {
            console.error('Leave time must be after 6:00 AM');
            showToast('Leave time must be after 6:00 AM', 'error');
            return;
        }
        
        if (returnHour >= 21) {
            console.error('Return time must be before 9:00 PM');
            showToast('Return time must be before 9:00 PM', 'error');
            return;
        }
        
        if (returnTime <= leaveTime) {
            console.error('Return time must be after leave time');
            showToast('Return time must be after leave time', 'error');
            return;
        }
        
        // Accept terms validation
        const termsCheckbox = document.getElementById('termsAgreement');
        if (termsCheckbox && !termsCheckbox.checked) {
            console.error('You must accept the terms and conditions');
            showToast('You must accept the terms and conditions', 'error');
            return;
        }
        
        // Create form data payload
        const payload = {
            rider_id: userData.memberId,
            leave_time: formElements.leaveTime.value,
            return_time: formElements.returnTime.value,
            destination: formElements.destination.value.trim(),
            purpose: formElements.purpose.value.trim(),
            transport_mode: formElements.transportMode.value
        };
        
        console.log('Submit payload:', payload);
        
        // Show loading indicator
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading-spinner';
        document.body.appendChild(loadingElement);
        
        // Disable submit button and show submitting state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
        }
        
        // CSRF token from cookie
        const csrftoken = getCookie('csrftoken');
        
        // Submit to server
        fetch('/iiit/normal/gate-pass/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            // Remove loading indicator
            if (loadingElement.parentNode) {
                document.body.removeChild(loadingElement);
            }
            
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalButtonText;
            }
            
            if (data.status === 'success') {
                console.log('Gate pass created successfully:', data);
                
                // Show success message
                showToast('Gate pass created successfully!', 'success');

        // Close the modal
        closeModal('gatePassModal');

                // Refresh the gate pass list
                setTimeout(() => {
                    refreshGatePassStatus();
                }, 1000);
                
                // Clear form
                document.getElementById('gatePassForm').reset();
            } else {
                console.error('Error creating gate pass:', data.message);
                showToast(data.message || 'Error creating gate pass. Please try again.', 'error');
            }
        })
        .catch(error => {
            console.error('Error submitting gate pass:', error);
            
            // Remove loading indicator
            if (loadingElement.parentNode) {
                document.body.removeChild(loadingElement);
            }
            
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalButtonText;
            }
            
            showToast('Error submitting gate pass. Please try again later.', 'error');
            
            // If API call fails, use fallback mock submission for development
            if (window.DEVELOPMENT_MODE) {
                console.log('Using mock submission due to API error');
                fallbackMockSubmission(payload);
            }
        })
        .finally(() => {
            // Always re-enable the button and restore text afterwards
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalButtonText;
            }
        });
    } catch (error) {
        console.error('Error in submitGatePass:', error);
        showToast('An unexpected error occurred. Please try again.', 'error');
        // Ensure button is restored even if synchronous error occurs before fetch
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalButtonText;
        }
    }
}

// Fallback mock submission function for development purposes only
function fallbackMockSubmission(payload) {
    console.log('Using mock submission with payload:', payload);

    // Close the modal
    closeModal('gatePassModal');
    
    // Generate a random gate pass ID (6 digits)
    const gatePassId = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Get current timestamp
    const now = new Date();
    
    // Create a new gate pass object with the submitted data
    const newGatePass = {
        id: gatePassId,
        leave_date: new Date().toISOString().split('T')[0],
        leave_time: payload.leave_time,
        return_date: new Date().toISOString().split('T')[0],
        return_time: payload.return_time,
        destination: payload.destination,
        purpose: payload.purpose,
        transport_mode: payload.transport_mode,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        status: 'pending',
        type: 'normal'
    };
    
    // Add to mock data
    if (!window.mockGatePasses) {
        window.mockGatePasses = [];
    }
    
    // Add to beginning of array
    window.mockGatePasses.unshift(newGatePass);
    
    // Update the UI with the new gate pass
    updateGatePassUI(window.mockGatePasses);

        // Show success message
    showToast('Demo mode: Gate pass created successfully', 'success');
    
    // Reset form
        const form = document.getElementById('gatePassForm');
        if (form) {
            form.reset();
        
        // Set default times
        setDefaultTimes();
    }
}

// Function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Refresh gate pass status from the server
function refreshGatePassStatus() {
    // Get rider_id from URL parameters (check both lowercase and uppercase variants) or Django context
    const urlParams = new URLSearchParams(window.location.search);
    const riderId = urlParams.get('riderId') || urlParams.get('riderID') || window.initialRiderId || null;
    
    // If no rider ID is available or it's "None" or "null", don't try to fetch gate pass data
    if (!riderId || riderId === "None" || riderId === "null") {
        console.log('No valid rider ID provided, cannot fetch gate pass data');
        return;
    }
    
    console.log(`Fetching gate pass data for rider ID: ${riderId}`);
    
    // Call the normal gate pass status API
    fetch(`/iiit/normal/gate-pass/status/${riderId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Gate pass status data:', data);
            
            if (data.status === 'success') {
                console.log('[Normal] Gate pass status data received:', data);
                // Update UI with the received gate passes
                updateGatePassUI(data.gate_passes); // Pass the list to the UI function
                
                // --- Enable/Disable Create Button --- 
                const createButton = document.querySelector('.create-gate-pass-btn');
                if (createButton) {
                    if (data.is_gatepass_enabled === false) {
                        createButton.disabled = true;
                        createButton.classList.add('disabled'); // Add class for styling
                        createButton.title = 'Gate pass creation disabled due to default count.';
                        console.log("[Normal] Gate pass creation DISABLED.");
                    } else {
                        createButton.disabled = false;
                        createButton.classList.remove('disabled'); // Remove class
                        createButton.title = 'Create New Gate Pass'; // Reset title
                        console.log("[Normal] Gate pass creation ENABLED.");
                    }
                }
                // --- End Enable/Disable --- 

            } else {
                console.error('Error fetching gate pass data:', data.message);
                // If API fails, use mock data (for development)
                if (window.DEVELOPMENT_MODE) {
        displayRequests();
                }
                
                // Show error message
                showToast('Error loading gate passes. Using demo data.', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching gate pass data:', error);
            // If API fails, use mock data (for development)
            if (window.DEVELOPMENT_MODE) {
                displayRequests();
            }
            
            // Show error message
            showToast('Error connecting to server. Using demo data.', 'error');
        });
}

// Update the gate pass UI based on fetched data
function updateGatePassUI(gatePassList) {
    window.currentNormalGatePasses = gatePassList || []; // Store the fetched list
    const requestsContainer = document.getElementById('requestsContainer');
    const pendingCountElement = document.querySelector('.status-card.pending .status-count');
    const approvedCountElement = document.querySelector('.status-card.approved .status-count');
    const rejectedCountElement = document.querySelector('.status-card.rejected .status-count');

    requestsContainer.innerHTML = ''; // Clear existing cards

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    if (gatePassList && gatePassList.length > 0) {
        console.log(`Received ${gatePassList.length} requests. Filtering for type 'normal' and calculating counts...`);
        
        const normalGatePasses = gatePassList.filter(request => request.type === 'normal');
        
        console.log(`Found ${normalGatePasses.length} 'normal' type requests.`);

        if (normalGatePasses.length === 0) {
            requestsContainer.innerHTML = '<div class="no-requests-message"><p>You haven\'t submitted any normal gate pass requests yet.</p></div>';
        } else {
            normalGatePasses.forEach(request => {
                // Create and append card element
                const card = createServerRequestElement(request);
                requestsContainer.appendChild(card);

                // Update counts based on the numeric status_code
                // Use request.status_code here!
                if (request.status_code === 0) {
                    pendingCount++;
                } else if (request.status_code === 1) {
                    approvedCount++;
                } else if (request.status_code === 3) { 
                    rejectedCount++;
                }
            });
        }
    } else {
        requestsContainer.innerHTML = '<div class="no-requests-message"><p>No gate pass requests found.</p></div>';
    }

    // Update status card counts in the UI
    if (pendingCountElement) pendingCountElement.textContent = pendingCount;
    if (approvedCountElement) approvedCountElement.textContent = approvedCount;
    if (rejectedCountElement) rejectedCountElement.textContent = rejectedCount;
    
    console.log(`Counts updated: Pending=${pendingCount}, Approved=${approvedCount}, Rejected=${rejectedCount}`);

    // Re-initialize ripple effect for new cards
    initializeRippleEffect();
}

// Create a request element from server data
function createServerRequestElement(request) {
    const element = document.createElement('div');
    element.className = 'request-card ripple';
    element.setAttribute('data-request-id', request.id);

    // Format the times
    const leaveTimeDisplay = formatTimeForDisplay(request.leave_time);
    const returnTimeDisplay = formatTimeForDisplay(request.return_time);

    // Determine status text and class based on numeric status_code
    const statusCode = request.status_code;
    const statusText = getStatusText(statusCode); 
    
    let statusClass = 'unknown'; // Default class
    switch (statusCode) {
        case 0: statusClass = 'pending'; break;
        case 1: statusClass = 'approved'; break;
        case 2: statusClass = 'out'; break; // Add class for 'Currently Out'
        case 3: statusClass = 'rejected'; break;
        case 4: statusClass = 'returned'; break; // Add class for 'Returned'
    }

    element.innerHTML = `
        <div class="request-header">
            <div class="request-destination">${request.destination || 'No Destination'}</div>
            <div class="request-status ${statusClass}">${statusText}</div>
        </div>
        <div class="request-dates">
            <div class="date-group">
                <div class="date-label">Leaving</div>
                <div class="date-value">Today</div>
                <div class="time-value">${leaveTimeDisplay}</div>
            </div>
            <div class="date-divider"></div>
            <div class="date-group">
                <div class="date-label">Returning</div>
                <div class="date-value">Today</div>
                <div class="time-value">${returnTimeDisplay}</div>
            </div>
        </div>
    `;

    // Add click handler to show details
    element.addEventListener('click', () => {
        showStatusDetail(request);
    });

    return element;
}

// Show Android-style toast notification
function showToast(message, type = 'success') {
    // Try to use native Android toast if available
    if (window.AndroidInterface && typeof window.AndroidInterface.showToast === 'function') {
        window.AndroidInterface.showToast(message);
        return;
    }
    
    // Otherwise use our custom toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        document.body.removeChild(existingToast);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Add toast to the document
    document.body.appendChild(toast);
    
    // Show toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Hide toast after 2.5 seconds (more Android-like)
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 2500);
}

// Confirm delete request
function confirmDeleteRequest(requestId) {
    // Create a mobile-optimized confirmation dialog instead of using native confirm
    const existingDialog = document.querySelector('.mobile-confirm-dialog');
    if (existingDialog) {
        document.body.removeChild(existingDialog);
    }
    
    // Create dialog element
    const dialog = document.createElement('div');
    dialog.className = 'mobile-confirm-dialog';
    
    dialog.innerHTML = `
        <div class="confirm-content">
            <div class="confirm-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <h3>Delete Request</h3>
            <p>Are you sure you want to delete this request?</p>
            <div class="confirm-actions">
                <button class="cancel-action ripple">Cancel</button>
                <button class="confirm-action ripple">Delete</button>
            </div>
        </div>
    `;
    
    // Add dialog to the document
    document.body.appendChild(dialog);
    
    // Show dialog with animation
    setTimeout(() => {
        dialog.classList.add('show');
    }, 10);
    
    // Add event listeners for the buttons
    const cancelButton = dialog.querySelector('.cancel-action');
    const confirmButton = dialog.querySelector('.confirm-action');
    
    cancelButton.addEventListener('click', () => {
        // Close the dialog
        dialog.classList.remove('show');
        setTimeout(() => {
            if (dialog.parentNode) {
                document.body.removeChild(dialog);
            }
        }, 300);
    });
    
    confirmButton.addEventListener('click', () => {
        // Close the dialog
        dialog.classList.remove('show');
        
        // Delete the request
        deleteRequest(requestId);
        
        // Remove the dialog from DOM after animation
        setTimeout(() => {
            if (dialog.parentNode) {
                document.body.removeChild(dialog);
            }
        }, 300);
    });
    
    // Add haptic feedback if available
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(5); // Short vibration for feedback
    }
}

// Delete request
function deleteRequest(requestId) {
    try {
        // Find the index of the request to delete
        const index = gatePassRequests.findIndex(request => request.id === requestId);
        
        if (index !== -1) {
            // Remove the request from the array
            const deletedRequest = gatePassRequests.splice(index, 1)[0];
            
            // Update the pending count if it was a pending request
            if (deletedRequest.status === 'in-progress' || deletedRequest.status === 'pending') {
                gatePassData.pending = Math.max(0, gatePassData.pending - 1);
                const pendingCount = document.querySelector('.status-card.pending .status-count');
                if (pendingCount) pendingCount.textContent = gatePassData.pending;
            }
            
            // Update the request cards display
            initializeRequestCards();
            
            // Show success toast
            showToast('Request deleted successfully', 'success');
            
            // Provide haptic feedback if available
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate([15, 30, 15]); // vibration pattern for success
            }
        } else {
            // Request not found
            showToast('Error: Request not found', 'error');
        }
    } catch (error) {
        // Log and show error
        console.error('Error deleting request:', error);
        showToast('Failed to delete request', 'error');
    }
}

// Initialize mock data
function initializeMockData() {
    // Mock user data
    userData.studentName = "John Doe";
    userData.rollNo = "2023001";
    userData.year = "2023";
    userData.hostelCode = "H1";
    userData.memberId = "1477243";
    userData.phone = "9876543210";
    userData.email = "john.doe@example.com";
    userData.guardianName = "Jane Doe";
    userData.guardianMobile = "9876543211";
    userData.guardianEmail = "jane.doe@example.com";
    userData.relation = "Father";
    userData.profilePicture = "https://randomuser.me/api/portraits/men/32.jpg";

    // Mock gate pass data
    gatePassData.pending = 2;
    gatePassData.approved = 5;
    gatePassData.rejected = 1;

    // Mock gate pass requests
    const mockRequest = {
        id: "GP-2023-10-001",
        destination: "Home - Family Function",
        purpose: "Family gathering",
        status: "approved",
        currentStep: 6,
        leaveDate: new Date("2023-10-15T09:30:00"),
        returnDate: new Date("2023-10-15T18:30:00"),
        transport: "Personal Vehicle",
        submittedOn: new Date("2023-10-12T10:30:00"),
        qrActive: true,
        qrData: JSON.stringify({
            id: "GP-2023-10-001",
            name: "John Doe",
            roll: "2023001",
            year: "2023"
        })
    };
    gatePassRequests.push(mockRequest);
}

function manualPreviewHandler() {
    try {
        console.log('Starting manual preview generation...');
        
        // Get form elements
        const leaveTimeInput = document.getElementById('leaveTime');
        const returnTimeInput = document.getElementById('returnTime');
        const destinationInput = document.getElementById('destination');
        const purposeInput = document.getElementById('purpose');
        const transportInput = document.getElementById('transport');
        const termsAgreement = document.getElementById('termsAgreement');
        
        // Required fields validation
        const requiredFields = [
            { element: leaveTimeInput, message: 'Please select a leave time' },
            { element: returnTimeInput, message: 'Please select a return time' },
            { element: destinationInput, message: 'Please enter your destination' },
            { element: purposeInput, message: 'Please enter your purpose of visit' },
            { element: transportInput, message: 'Please select a mode of transport' },
            { element: termsAgreement, message: 'Please agree to the terms and conditions' }
        ];
        
        let isValid = true;
        let firstInvalidField = null;
        
        // Validate each required field
        for (const { element, message: errorMessage } of requiredFields) {
            if (!element) {
                console.error(`Required element not found in the form`);
                continue;
            }
            
            // Remove any existing error styling/messages
            element.classList.remove('error');
            const existingError = element.parentNode.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            // Check if the field has a value
            const hasValue = element.type === 'checkbox' ? element.checked : element.value.trim() !== '';
            if (!hasValue) {
                isValid = false;
                element.classList.add('error');
                
                // Add error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = errorMessage;
                element.parentNode.insertBefore(errorDiv, element.nextSibling);
                
                if (!firstInvalidField) {
                    firstInvalidField = element;
                }
            }
        }
        
        // If validation fails, focus the first invalid field and stop
        if (!isValid) {
            console.log('Validation failed');
            if (firstInvalidField) {
                firstInvalidField.focus();
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        
        console.log('Validation passed, showing preview');
        
        // Helper function to format times
        function formatTimeForPreview(timeStr) {
            if (!timeStr) return '';
            const [hours, minutes] = timeStr.split(':');
            if (!hours || !minutes) return timeStr;
            
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
        }
        
        // Hide all steps and show step 3
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
            step.style.display = 'none';
        });
        const previewStep = document.querySelector('.form-step[data-step="3"]');
        if (previewStep) {
            previewStep.classList.add('active');
            previewStep.style.display = 'block';
        }
        
        // Update step indicators
        document.querySelectorAll('.step-indicator').forEach(indicator => {
            indicator.classList.remove('active', 'completed');
            const step = parseInt(indicator.getAttribute('data-step'));
            if (step < 3) {
                indicator.classList.add('completed');
            } else if (step === 3) {
                indicator.classList.add('active');
            }
        });
        
        // Get form values with fallbacks
        const leaveTime = leaveTimeInput ? leaveTimeInput.value : '';
        const returnTime = returnTimeInput ? returnTimeInput.value : '';
        const destination = destinationInput ? destinationInput.value : '';
        const purpose = purposeInput ? purposeInput.value : '';
        const transport = transportInput ? transportInput.value : '';
        
        // Format times
        const formattedLeaveTime = formatTimeForPreview(leaveTime);
        const formattedReturnTime = formatTimeForPreview(returnTime);
        
        // Update preview content
        const previewElements = {
            // Student Details
            'preview-studentName': userData.studentName,
            'preview-rollNo': userData.rollNo,
            'preview-yearHostel': `${userData.year} - ${userData.hostelCode}`,
            
            // Guardian Details
            'preview-parentName': userData.guardianName,
            'preview-relation': userData.relation,
            'preview-parentMobile': userData.guardianMobile,
            
            // Leave Details
            'previewLeaveDateTime': `Today, ${formattedLeaveTime}`,
            'previewReturnDateTime': `Today, ${formattedReturnTime}`,
            'previewDestination': destination,
            'previewPurpose': purpose,
            'previewTransport': transport
        };
        
        // Set values to preview elements
        for (const [id, value] of Object.entries(previewElements)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                console.log(`Set ${id} to: ${value}`);
            } else {
                console.error(`Preview element not found: ${id}`);
            }
        }
        
        console.log('Preview generation complete');
        
        // Force scroll to the top of the preview
        if (previewStep) {
            setTimeout(() => {
                previewStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
        
    } catch (error) {
        console.error('Error in manual preview handler:', error);
        showToast('Error generating preview: ' + error.message, 'error');
    }
}

// Initialize ripple effect for buttons and interactive elements
function initializeRippleEffect() {
    console.log('Initializing ripple effect...');
    
    // Add ripple effect to all elements with the ripple class
    document.querySelectorAll('.ripple').forEach(element => {
        element.addEventListener('click', function(e) {
            // Create ripple element
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-effect');
            
            // Get the click position relative to the element
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Set ripple position
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            // Add ripple to element
            this.appendChild(ripple);
            
            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    console.log('Ripple effect initialized');
}

// Function to navigate back from preview to leave details
function navigateBack() {
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
        step.style.display = 'none';
    });
    
    // Show step 2
    const leaveDetailsStep = document.querySelector('.form-step[data-step="2"]');
    leaveDetailsStep.classList.add('active');
    leaveDetailsStep.style.display = 'block';
    
    // Update indicators
    document.querySelectorAll('.step-indicator').forEach(indicator => {
        indicator.classList.remove('active', 'completed');
        const step = parseInt(indicator.getAttribute('data-step'));
        if (step < 2) {
            indicator.classList.add('completed');
        } else if (step === 2) {
            indicator.classList.add('active');
        }
    });
}

// Initialize date and time constraints when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Loading UI components...');
    
    // Initialize chips and other UI elements after a small delay
    // to ensure DOM is fully loaded
    setTimeout(() => {
        console.log('Initializing UI components...');
        // Initialize transport chips
        const transportChips = document.querySelectorAll('#transportChips .chip');
        const transportInput = document.getElementById('transport');
        
        // Initialize hostel chips
        const hostelChips = document.querySelectorAll('#hostelChips .chip');
        const hostelInput = document.getElementById('editHostel');
        
        hostelChips.forEach(chip => {
            chip.addEventListener('click', () => {
                hostelChips.forEach(c => c.classList.remove('selected'));
                chip.classList.add('selected');
                hostelInput.value = chip.getAttribute('data-value');
            });
        });

        // Set minimum date and time constraints
        const leaveTimeInput = document.getElementById('leaveTime');
        const returnTimeInput = document.getElementById('returnTime');

        // Get current date and time
        const now = new Date();
        const currentTime = now.toTimeString().slice(0,5);

        // Set initial minimum time
        leaveTimeInput.min = currentTime;

        // Update time constraints when date changes
        leaveTimeInput.addEventListener('change', function() {
            if (this.value === currentTime) {
                leaveTimeInput.min = currentTime;
            } else {
                leaveTimeInput.min = '00:00';
            }
            
            // Update return date minimum
            if (returnTimeInput.value < this.value) {
                returnTimeInput.value = this.value;
            }
        });

        returnTimeInput.addEventListener('change', function() {
            if (this.value === leaveTimeInput.value) {
                returnTimeInput.min = leaveTimeInput.value;
            } else {
                returnTimeInput.min = '00:00';
            }
        });

        // Initialize transport chips
        transportChips.forEach(chip => {
            chip.addEventListener('click', () => {
                transportChips.forEach(c => c.classList.remove('selected'));
                chip.classList.add('selected');
                transportInput.value = chip.getAttribute('data-value');
            });
        });

        console.log('Date and time constraints initialized');
        
        // Automatically show the completed gate pass with unlocked QR after a short delay
        setTimeout(() => {
            if (window.gatePassRequests && window.gatePassRequests.length > 0) {
                // Find the approved gate pass
                const approvedPass = window.gatePassRequests.find(req => req.status === 'approved');
                if (approvedPass) {
                    // Show the approved gate pass detail
                    window.showStatusDetail(approvedPass);
                }
            }
        }, 1000);
    }, 100);
});

// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
    console.error('JavaScript error:', message, 'at line', lineno, 'in', source);
    alert('Error: ' + message);
    return true;
};

// Initialize terms checkbox functionality
function initializeTermsCheckbox() {
    const termsCheckbox = document.getElementById('termsAgreement');
    if (termsCheckbox) {
        termsCheckbox.addEventListener('click', function(e) {
            // Prevent the default checkbox behavior
            e.preventDefault();
            // Show the terms modal
            openModal('termsModal');
        });
    }
}

// Function to handle terms acceptance
function acceptTerms() {
    const termsCheckbox = document.getElementById('termsAgreement');
    if (termsCheckbox) {
        termsCheckbox.checked = true;
        closeModal('termsModal');
    }
}

function initializeTimeInputs() {
    const leaveTimeInput = document.getElementById('leaveTime');
    const returnTimeInput = document.getElementById('returnTime');

    // Set min and max times for leave time (6:00 AM to 9:00 PM)
    leaveTimeInput.min = '06:00';
    leaveTimeInput.max = '21:00';

    // Set min and max times for return time (6:00 AM to 9:00 PM)
    returnTimeInput.min = '06:00';
    returnTimeInput.max = '21:00';

    // Add event listeners to validate time selection
    leaveTimeInput.addEventListener('change', function() {
        if (returnTimeInput.value) {
            validateTimeRange();
        }
    });

    returnTimeInput.addEventListener('change', function() {
        if (leaveTimeInput.value) {
            validateTimeRange();
        }
    });
}

function validateTimeRange() {
    const leaveTime = document.getElementById('leaveTime').value;
    const returnTime = document.getElementById('returnTime').value;

    if (leaveTime && returnTime) {
        const leaveDateTime = new Date(`2000/01/01 ${leaveTime}`);
        const returnDateTime = new Date(`2000/01/01 ${returnTime}`);

        if (returnDateTime <= leaveDateTime) {
            showToast('Return time must be after leave time', 'error');
            document.getElementById('returnTime').value = '';
        }
    }
}

// Initialize status cards functionality
function initializeStatusCards() {
    const statusCards = document.querySelectorAll('.status-card');
    const requestsContainer = document.querySelector('.requests-container');
    
    if (!statusCards.length || !requestsContainer) {
        console.error('Status cards or requests container not found');
        return;
    }

    // Add click event listeners to status cards
    statusCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove active class from all cards
            statusCards.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked card
            this.classList.add('active');
            
            // Get the status from the card's data attribute or class
            const status = this.classList.contains('pending') ? 'pending' : 
                          this.classList.contains('approved') ? 'approved' : 
                          this.classList.contains('rejected') ? 'rejected' : 'all';
            
            // Filter the requests
            filterRequests(status);
        });
    });
}

// Filter requests based on status
function filterRequests(status) {
    const requests = document.querySelectorAll('.request-card');
    
    requests.forEach(request => {
        const requestStatus = request.querySelector('.request-status').textContent.toLowerCase();
        
        if (status === 'all' || requestStatus.includes(status)) {
            request.style.display = 'block';
            // Add a subtle fade-in animation
            request.style.opacity = '0';
            setTimeout(() => {
                request.style.opacity = '1';
            }, 50);
        } else {
            request.style.display = 'none';
        }
    });
    
    // Check if there are any visible requests
    const visibleRequests = Array.from(requests).filter(req => req.style.display !== 'none');
    const noRequestsMessage = document.querySelector('.no-requests-message');
    
    if (visibleRequests.length === 0) {
        if (!noRequestsMessage) {
            const message = document.createElement('div');
            message.className = 'no-requests-message';
            message.innerHTML = `
                <i class="fas fa-inbox"></i>
                <p>No ${status === 'all' ? '' : status} requests found</p>
            `;
            document.querySelector('.requests-container').appendChild(message);
        } else {
            noRequestsMessage.style.display = 'block';
            noRequestsMessage.querySelector('p').textContent = `No ${status === 'all' ? '' : status} requests found`;
        }
    } else if (noRequestsMessage) {
        noRequestsMessage.style.display = 'none';
    }
}

// Initialize touch interactions - COMMENTING OUT
/*
function initializeTouchInteractions() {
    const scrollableElements = [
        document.querySelector('.main-content'),
        document.querySelector('.requests-container'),
        ...document.querySelectorAll('.modal-content')
    ];

    scrollableElements.forEach(element => {
        if (!element) return;

        let startY;
        let startScrollTop;
        let currentScroll;

        element.addEventListener('touchstart', (e) => {
            startY = e.touches[0].pageY;
            startScrollTop = element.scrollTop;

            // If we're at the top, allow scroll
            if (startScrollTop <= 0) {
                element.style.overflowY = 'auto';
            }
        }, { passive: true });

        element.addEventListener('touchmove', (e) => {
            if (!startY) return;

            const currentY = e.touches[0].pageY;
            const deltaY = currentY - startY;
            currentScroll = startScrollTop - deltaY;

            // Smooth scrolling
            element.scrollTop = currentScroll;

            // Prevent overscroll at top and bottom
            if (currentScroll <= 0) {
                element.scrollTop = 0;
            } else if (currentScroll + element.clientHeight >= element.scrollHeight) {
                element.scrollTop = element.scrollHeight - element.clientHeight;
            }
        }, { passive: true });

        element.addEventListener('touchend', () => {
            startY = null;
            startScrollTop = null;
        }, { passive: true });
    });

    // Prevent pull-to-refresh
    document.body.addEventListener('touchmove', (e) => {
        if (document.body.scrollTop === 0) {
            e.preventDefault();
        }
    }, { passive: false });
}
*/

// Function to update profile through the API
function updateProfile() {
    // Check if user data is available
    if (!userData.memberId) {
        console.error('No member ID available. Please log in first.');
        showToast('Please log in to update your profile.', 'error');
        closeModal('profileEditModal');
        return;
    }
    
    // Get form elements
    const editName = document.getElementById('editName');
    const editRollNo = document.getElementById('editRollNo');
    const editYear = document.getElementById('editYear');
    const editHostel = document.getElementById('editHostel');
    const editGuardianName = document.getElementById('editGuardianName');
    const editGuardianPhone = document.getElementById('editGuardianPhone');
    const editGuardianEmail = document.getElementById('editGuardianEmail');
    const editRelation = document.getElementById('editRelation');
    
    // Simple validation
    if (!editName || !editRollNo || !editYear || !editHostel || !editGuardianName || !editGuardianPhone) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Check if relation is selected
    if (!editRelation.value) {
        showToast('Please select a relation', 'error');
        return;
    }
    
    // Validate phone number
    if (editGuardianPhone.value && (editGuardianPhone.value.length !== 10 || !/^\d+$/.test(editGuardianPhone.value))) {
        showToast('Phone number must be 10 digits', 'error');
        return;
    }
    
    // Create request payload
    const payload = {
        rider_id: userData.memberId,
        roll_no: editRollNo.value,
        year: editYear.value,
        hostel: editHostel.value,
        guardian_name: editGuardianName.value,
        guardian_phone: editGuardianPhone.value,
        guardian_email: editGuardianEmail.value,
        relation: editRelation.value,
        additional_contact_1: document.getElementById('editAdditionalContact1')?.value || '',
        additional_contact_2: document.getElementById('editAdditionalContact2')?.value || ''
    };
    
    // Validate additional phone numbers
    if (payload.additional_contact_1 && (payload.additional_contact_1.length !== 10 || !/^\d+$/.test(payload.additional_contact_1))) {
        showToast('Additional contact 1 must be 10 digits', 'error');
        return;
    }
    if (payload.additional_contact_2 && (payload.additional_contact_2.length !== 10 || !/^\d+$/.test(payload.additional_contact_2))) {
        showToast('Additional contact 2 must be 10 digits', 'error');
        return;
    }
    
    // Disable the submit button
    const submitButton = document.querySelector('#profileEditModal .submit-btn');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<div class="loading-spinner"></div> Updating...';
    }
    
    // Get CSRF token from cookie
    const csrftoken = getCookie('csrftoken');
    
    // Submit request to backend API
    fetch('/iiit/normal/profile/update/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Re-enable the submit button
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Update';
        }
        
        if (data.status === 'success') {
            // Close the modal
            closeModal('profileEditModal');
            
            // Show success message
            showToast(data.message || 'Profile updated successfully', 'success');
            
            // Update local user data - Ensure ALL relevant fields are updated
            userData.memberId = editMemberId.value; // Add memberId update
            userData.studentName = editName.value; // Add studentName update
            userData.phone = editPhone.value;     // Add phone update
            userData.email = editEmail.value;     // Add email update
            userData.rollNo = editRollNo.value;
            userData.year = editYear.value;
            userData.hostelCode = editHostel.value;
            userData.guardianName = editGuardianName.value;
            userData.guardianMobile = editGuardianPhone.value;
            userData.guardianEmail = editGuardianEmail.value;
            userData.relation = editRelation.value;
            // Note: Profile picture update needs separate handling if implemented
            // Note: Additional contacts are handled dynamically, ensure their values are updated if needed
            
            // Refresh UI with updated data
            updateProfileUI();
            
            // Restore original URL if available
            if (window.originalUrlParams) {
                const newUrl = window.location.pathname + '?' + window.originalUrlParams;
                history.replaceState(null, document.title, newUrl);
                console.log('Restored original URL parameters after profile update:', window.originalUrlParams);
            }
        } else {
            showToast(data.message || 'Failed to update profile', 'error');
        }
    })
    .catch(error => {
        // Re-enable the submit button
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Update';
        }
        
        console.error('Error updating profile:', error);
        showToast('Failed to update profile: ' + error.message, 'error');
        
        // If API submission fails, use mock update for development
        if (window.DEVELOPMENT_MODE) {
            // Mock update for development
            userData.rollNo = editRollNo.value;
            userData.year = editYear.value;
            userData.hostelCode = editHostel.value;
            userData.guardianName = editGuardianName.value;
            userData.guardianMobile = editGuardianPhone.value;
            userData.guardianEmail = editGuardianEmail.value;
            userData.relation = editRelation.value;
            
            updateProfileUI();
            closeModal('profileEditModal');
            showToast('Profile updated successfully (MOCK)', 'success');
        }
    });
}

// Function to update the timeline display in the status detail modal for Normal Gate Pass
function updateNormalTimeline(statusCode, finalActionByRole) {
    console.log(`Updating timeline for NORMAL gate pass status code: ${statusCode}, finalActionByRole: ${finalActionByRole}`);
    const steps = document.querySelectorAll('#statusDetailModal .timeline-step');
    // Correctly select the progress bar element itself, assuming the ID is on the bar
    const progressBarElement = document.getElementById('approvalProgress'); 
    
    if (!steps || steps.length < 5 || !progressBarElement) { // Check for the bar element
        console.error('Timeline elements (5 steps expected) or progress bar element with ID \'approvalProgress\' not found.');
        return;
    }
    // No longer needed:
    // const progressBarElement = progressBarContainer.querySelector('.progress-bar'); 
    // if (!progressBarElement) {
    //     console.error('Progress bar inner element not found.');
    //     return;
    // }

    // --- Refactored Logic --- 
    let currentStepNumber = 1; // Default to submitted
    let progressPercent = 10; // Base progress

    // Determine logical current step based on status code
    // Statuses: 0=Pending, 1=Approved, 2=Out, 3=Rejected, 4=Returned, 5=Defaulter
    if (statusCode === 3) { // Rejected
        currentStepNumber = 3; // Rejection happens at Admin step
        progressPercent = 40; 
    } else if (statusCode === 0) { // Pending Admin
        currentStepNumber = 3;
        progressPercent = 40;
    } else if (statusCode === 1) { // Approved (Ready for Security/Out)
        currentStepNumber = 4;
            progressPercent = 60;
    } else if (statusCode === 2) { // Currently Out
        currentStepNumber = 5;
            progressPercent = 80;
    } else if (statusCode === 4) { // Returned
        currentStepNumber = 5; // Mark as completed
            progressPercent = 100;
    } else if (statusCode === 5) { // Defaulter
        currentStepNumber = 5; // Show Defaulter at the last step
        progressPercent = 100; // Visually complete, but with warning
    }

    // Helper function to format role names for display
    const formatRoleName = (role) => {
        if (!role) return 'Admin'; // Default if no role provided
        switch (role?.toLowerCase()) { // Added safe navigation
            case 'caretaker': return 'Caretaker';
            case 'asst_mgr':
            case 'asst manager':
                return 'Asst Manager';
            case 'warden': return 'Warden';
            default: return 'Admin';
        }
    };

    // Update steps visually
    steps.forEach(step => {
        const stepNumber = parseInt(step.dataset.step);
        const iconElement = step.querySelector('.step-icon i');
        const labelElement = step.querySelector('.step-label');
        const originalIconClass = iconElement?.className; // Store original icon
        const originalLabelText = labelElement?.textContent; // Store original label

        if (!iconElement || !labelElement) {
            console.error(`Timeline elements missing for step ${stepNumber}`);
            return;
        }

        // Reset classes and icon
        step.className = 'timeline-step'; // Base class only
        iconElement.className = originalIconClass;

        // --- Apply State based on calculated currentStepNumber --- 
        if (statusCode === 3 && stepNumber === 3) { // Handle Admin Rejection
            step.classList.add('rejected');
            iconElement.className = 'fas fa-times';
            labelElement.textContent = `Rejected by ${formatRoleName(finalActionByRole)}`;
        } else if (statusCode === 3 && stepNumber > 3) { // Steps after rejection
            step.classList.add('disabled-rejected', 'pending'); // Mark as disabled/pending
            // Keep original icon
        } else if (stepNumber < currentStepNumber) { // Completed steps
            step.classList.add('completed');
            if (stepNumber === 3) { // Completed Admin
                iconElement.className = 'fas fa-user-shield'; // Keep admin icon
                labelElement.textContent = `${formatRoleName(finalActionByRole)}`;
            } else if (stepNumber === 4) { // Completed Security/Out
                 iconElement.className = 'fas fa-shield-alt'; // Keep security icon
            }
            // Steps 1, 2 keep original icons implicitly
        } else if (stepNumber === currentStepNumber) { // Active step
            step.classList.add('active');
            if (stepNumber === 3) { // Active Admin
                iconElement.className = 'fas fa-user-shield';
                labelElement.textContent = 'Admin';
            } else if (stepNumber === 4) { // Active Security/Out
                iconElement.className = 'fas fa-shield-alt';
                 labelElement.textContent = 'Ready for Check-Out'; // Or similar active label
            } else if (stepNumber === 5) { // Active Final Step (Out or Defaulter)
                if (statusCode === 2) { // Currently Out
                    step.classList.add('active'); // Still active, not completed
                    iconElement.className = 'fas fa-walking';
                    labelElement.textContent = 'Currently Out';
                } else if (statusCode === 5) { // Defaulter
                    step.classList.add('defaulter'); // Use a specific class for styling
                    iconElement.className = 'fas fa-exclamation-triangle';
                    labelElement.textContent = 'Defaulter';
                }
                 // If statusCode is 4 (Returned), it should be handled by stepNumber < currentStepNumber logic below
            }
            // Steps 1, 2 keep original icons implicitly when active (though they usually won't be active)
        } else { // Pending steps
            step.classList.add('pending');
            // Keep original icons
        }

        // Special case for step 5 when status is Returned (4)
        if (stepNumber === 5 && statusCode === 4) {
            step.classList.remove('active', 'pending', 'defaulter'); // Ensure other states removed
            step.classList.add('completed');
            iconElement.className = 'fas fa-sign-in-alt';
            labelElement.textContent = 'Returned';
        }
        
        // ** Final check for Admin Step 3 label if it was rejected **
        // This ensures the rejection label persists even if loop logic didn't catch it above
        if (stepNumber === 3 && statusCode === 3 && !step.classList.contains('rejected')) {
             console.warn("Re-applying rejected state to Step 3 just in case");
             step.classList.add('rejected');
             iconElement.className = 'fas fa-times';
             labelElement.textContent = `Rejected by ${formatRoleName(finalActionByRole)}`;
        }
         // ** Final check for Admin Step 3 label if it was approved **
         // This ensures the approval label persists if overall status is 2, 4 or 5
         else if (stepNumber === 3 && (statusCode === 1 || statusCode === 2 || statusCode === 4 || statusCode === 5) && !step.classList.contains('rejected')) {
             if (!step.classList.contains('completed')) {
                 step.classList.add('completed'); // Ensure completed class is set
             }
             iconElement.className = 'fas fa-user-shield'; // Ensure icon is correct
             labelElement.textContent = `${formatRoleName(finalActionByRole)}`;
         }
    });

    // Update progress bar style
    progressBarElement.style.width = `${progressPercent}%`;
    progressBarElement.style.backgroundColor = (statusCode === 3 || statusCode === 5) ? 'var(--primary-color)' : 'var(--primary-color)'; // Red for Rejected or Defaulter

    console.log(`Normal Timeline updated. Progress: ${progressPercent}%`);
}

// Style for disabled timeline steps (add this to your CSS)
/*
.timeline-step.disabled .step-icon {
    background-color: #e0e0e0;
    border-color: #bdbdbd;
}
.timeline-step.disabled .step-icon i {
    color: #9e9e9e;
}
.timeline-step.disabled .step-label {
    color: #9e9e9e;
}
*/

// Check if the user has reached the daily gate pass limit
function checkGatePassLimit() {
    const passes = window.currentNormalGatePasses || [];
    const todayDateString = new Date().toLocaleDateString('en-CA'); // Get YYYY-MM-DD format

    const submittedToday = passes.filter(pass => {
        try {
            // Extract date part from created_at (YYYY-MM-DD HH:MM:SS)
            const createdAtDateString = pass.created_at.split(' ')[0];
            return createdAtDateString === todayDateString;
        } catch (e) {
            console.error('Error parsing created_at date:', pass.created_at, e);
            return false;
        }
    });

    const submittedTodayCount = submittedToday.length;
    const rejectedTodayCount = submittedToday.filter(pass => pass.status_code === 3).length;

    const baseLimit = 2;
    const allowedLimit = baseLimit + rejectedTodayCount;

    console.log(`Gate Pass Limit Check: Submitted Today=${submittedTodayCount}, Rejected Today=${rejectedTodayCount}, Allowed Limit=${allowedLimit}`);

    if (submittedTodayCount >= allowedLimit) {
        showToast(`Daily limit reached. You can submit ${allowedLimit} passes today (${baseLimit} base + ${rejectedTodayCount} for rejected).`, 'warning');
        return false; // Limit reached
    }

    return true; // Can submit
}


