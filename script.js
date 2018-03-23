let inputJson = document.getElementById("input-json");
let inputTs = document.getElementById("input-ts");
let output = "";

function transform(){
    let output = "";
    clearStack();
    if(!isValidJson()){
        showMessage("JSON invalid");
        return;
    }
    const json = JSON.parse(inputJson.value);
    output += mapper(json, true);
    
    while(true){
        let stack = getObjectsStack();
        if(stack){
            stack.forEach((obj, index) => {
                output += mapper(obj.object, false, obj.name);
                setNullObjectStack(index);
            });

            output = replaceObjectNames(output);
            removeNullObjectsStack();
            if(!getObjectsStack() || getObjectsStack().length == 0) break;
        }else{
            break;
        }
    }

    inputTs.value = output;
}

function replaceObjectNames(output){
    const stack = getObjectsStack();
    if(stack){
        
        stack.forEach(obj => {
            output = output.replace(`%${obj.name}%`, setCamelCase(obj.name));
        });
    }
    return output
}

function mapper(object, first, nameAttr){
    if(first && Array.isArray(object)){
        object = {"myObject2": object};
    }

    let str = setInitialInterface(object, nameAttr);
    for(var propertyName in object) { 
        let name = propertyName;
        let value = object[name];
        let type = getType(value, name);

        str += `     ${name}${type.optional? '?' : ''}: ${type.type};\n`
    }
    str += setEndInterface(object);
    return str;
}

function setInitialInterface(object, nameAttr){
   
    return `export interface ${nameAttr? setCamelCase(nameAttr) : 'MyObject'} {\n`;
}

function validadeNameAttribute(name){
    return name.replace(/[^a-zA-Z0-9]/g, "_");
}

function setEndInterface(object){
   return "};\n\n";
}

function isValidJson(){
    try{
        JSON.parse(inputJson.value);
    }catch(error){
        return false;
    }
    return true;
}

function showMessage(message){
    alert(message);
}

function getType(attribute, nameAttr){
    switch(typeof attribute){
        case "undefined": {
            return {type: "undefined",optional: true};
            break;
        }

        case "boolean": {
            return  {type: "boolean"};
            break;
        }

        case "object": {
            if(attribute === null) return {type:"any",  optional: true};

            if(JSON.stringify(attribute) === JSON.stringify({})) return {type:"any",  optional: true};

            if(isArray(attribute)){
                if(attribute.length > 0){
                    let arrayType = getType(attribute[0], nameAttr);
                    return{type: `Array<${arrayType.type}>`, optional: arrayType.optional};
                }
                return {type: "Array<any>",optional: true};
            } 
            
            addObjectStack(attribute,nameAttr);
            return {type: `%${nameAttr}%`};
            break;
        }
        case "number": {
            return {type: `number`};
            break;
        }
        case "function": {
            return {type:"Function"}
            break;
        }

        case "string": {
            if(isDate(attribute)) return {type:"Date"};
            
            if(attribute.length == 0) return  {type:"any",  optional: true};

             if(attribute[attribute.length-2]== '(' && attribute[attribute.length-1]== ')') return  {type:"Function"};

            return  {type:"string"}
            break;
        }
    }
}

function isDate(attribute){
    const date = new Date(attribute);
    if(`${attribute}`.length < 10 || date ==  "Invalid Date") return false;
    return true
}

function isArray(attribute){
   if(Array.isArray(attribute)) return true;
   return false;
}

function setCamelCase(value){
    return `${value}`.charAt(0).toUpperCase() + `${value}`.slice(1);
}

function addObjectStack(object, name){
    let stack = getObjectsStack();
    if(!stack) stack = [];
    let index = stack.length;
    stack.push({name: name, object: object});
    localStorage.setItem(`stack`,JSON.stringify(stack));
    return index;
}

function getObjectsStack(object){
   return JSON.parse(localStorage.getItem("stack"));
}

function clearStack(){
   return localStorage.clear();
}

function setNullObjectStack(index){
   let stack = getObjectsStack();
   stack[index].object = null;
   localStorage.setItem(`stack`,JSON.stringify(stack));
}

function removeNullObjectsStack(){
   let stack = getObjectsStack();
   let aux = [];
   stack.forEach(obj => {
       if(obj.object != null) aux.push(obj);
   })
   localStorage.setItem(`stack`,JSON.stringify(aux));
}

function verifyTab(e){
    if(e && e.keyCode == 9){
        e.preventDefault();
        const position = inputJson.selectionStart;
        const textBefore = inputJson.value.substring(0, position);
        const textAfter = inputJson.value.substring(position, inputJson.value.length);
        inputJson.value = `${textBefore}    ${textAfter}`;
        inputJson.selectionStart = position + 4;
        inputJson.selectionEnd = position + 4;
    } 
}

function setDemo(){
    inputJson.value = 
`{
    "data": [{
        "type": "articles",
        "id": "1",
        "attributes": {
        "title": "JSON API paints my bikeshed!",
        "body": "The shortest article. Ever.",
        "created": "2015-05-22T14:56:29.000Z",
        "updated": "2015-05-22T14:56:28.000Z"
        },
        "relationships": {
            "author": {
                "data": {"id": "42", "type": "people"}
            }
        }
    }],
    "included": [
        {
            "type": "people",
            "id": "42",
            "attributes": {
                "name": "John",
                "age": 80,
                "gender": "male"
            }
        }
    ]
}`
}

function clearInput(){
    inputJson.value = "";
    inputTs.value = "";
}

function clipborad(){
    inputTs.select();
    document.execCommand("Copy");
}