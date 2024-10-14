    
function addField() {
    const fieldContainer = document.getElementById('fields');
    const newField = document.createElement('div');
    newField.className = 'field';
    newField.innerHTML = `
        <input type="text" name="fieldNames[]" placeholder="Field Name" required>
        <select name="fieldTypes[]" onchange="handleTypeChange(this)" required>
            <option value="INT">INT</option>
            <option value="VARCHAR">VARCHAR</option>
            <option value="TEXT">TEXT</option>
            <option value="DATE">DATE</option>
        </select>
        <input type="number" name="fieldSizes[]" placeholder="Size" style="display:none;" min="1">
    `;
    fieldContainer.appendChild(newField);
}

function handleTypeChange(select) {
    const sizeInput = select.nextElementSibling;
    if (select.value === 'VARCHAR') {
        sizeInput.style.display = 'inline';
    } else {
        sizeInput.style.display = 'none';
    }
}

async function fetchTables(databaseName) {
    const response = await fetch(`/get-tables?database=${databaseName}`);
    const tables = await response.json();
    const tableSelects = document.querySelectorAll('.table-select');
    tableSelects.forEach(select => {
        select.innerHTML = '<option value="">Selecciona la tabla</option>';
        tables.forEach(table => {
            select.innerHTML += `<option value="${table}">${table}</option>`;
        });
    });
}

async function fetchFields(databaseName, tableName) {
    const response = await fetch(`/get-fields?database=${databaseName}&table=${tableName}`);
    const fields = await response.json();
    const insertDataForm = document.getElementById('insert-data-form');
    const updateDataForm = document.getElementById('update-data-form');
    const deleteDataForm = document.getElementById('delete-data-form');

    insertDataForm.innerHTML = '';
    updateDataForm.innerHTML = '';
    deleteDataForm.innerHTML = '';

    fields.forEach(field => {
        if (field !== 'id') {
            insertDataForm.innerHTML += `<input type="text" name="${field}" placeholder="${field}" required>`;
            updateDataForm.innerHTML += `<input type="text" name="${field}" placeholder="${field}">`;
        }
    });

    updateDataForm.innerHTML += '<input type="number" name="id" placeholder="ID" required>';
    deleteDataForm.innerHTML += '<input type="number" name="id" placeholder="ID" required>';
}




