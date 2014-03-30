function collapseOperations(operations)
{
  //TODO: add "hardcore/compact mode" that generates matrix operations instead of multiple translate/rotate/scale operations
  var collapsedHistory = [];
  var operation = null;
  var prevOperation = operation;
  
  /*if(operations === undefined || operations.length==0)
  { return collapsedHistory }*/

  for( var i=0; i<operations.length;i++)
  {
    var operation = operations[i].clone();
    console.log("operation.value",operation.value);
    if(prevOperation != null && operation.type == prevOperation.type && operation.target == prevOperation.target && operation.value)
    {
      //console.log("type",operation.type, "value", operation.value.clone().add(prevOperation.value), "target", operation.target);
      //todo use correct operands ("add", "+" etc)
      if(operation.value instanceof(THREE.Vector3) || operation.value instanceof(THREE.Vector2))
      {
        console.log("updating", prevOperation.value ,"with", operation.value);
        prevOperation.value.add( operation.value );
      }
      else if (operation.value instanceof(THREE.Euler) )
      {
        prevOperation.value.set( prevOperation.value.x+operation.value.x, prevOperation.value.y+operation.value.y, prevOperation.value.z+operation.value.z); 
      }
      else
      {
        prevOperation.value += operation.value;
      }
    }
    else
    {
      collapsedHistory.push( operation );
      prevOperation = operation;
    }
    
  }
  //console.log("original ops", operations);
  console.log("collapse ops", collapsedHistory);
  return collapsedHistory;
}

function _isValidVector( vector )
{
  if(vector instanceof(THREE.Vector3)) //elimination of zero vectors
  {
    if(vector.equals(new THREE.Vector3()))
    {
      return false;
    }
    return true;
  }

  if(vector instanceof(THREE.Vector2)) //elimination of zero vectors
  {
    if(vector.equals(new THREE.Vector2()))
    {
      return false;
    }
    return true;
  }

}

function getOperationFormatedItemName(operation, attrName)
{
  if(attrName)
  { var attr = operation[attrName];
  }
  else
  {
    var attr = operation;
  }
  var itemName = attr.name.toLowerCase() || (attr.constructor.name.toLowerCase()  +new String(attr.id));

  return itemName;
}

function generateCodeFromOperation(operation, precision, targetFile, targetScope)
{
  var precision = precision || 2;
  var target = operation.target;
  var type = operation.type;
  var value = operation.value;

  //we apply the operations to the actual object, not its visual representation
  if(target.sourceElement) target = target.sourceElement;
  
  var targetName = getOperationFormatedItemName(operation, "target"); //(target.constructor.name.toLowerCase() || target.name.toLowerCase()) +new String(target.id);//    this.";//target.name;//@
  var code = "";
  var lineCap = ";\n";
  //TODO: if translate, rotate etc values are integers, do not display as float, or give the option to do so
  switch(type)
  {
    case "creation":
      var type = target.constructor.name || "foo";
      
      //TODO: refactor: this same code is present multiple times, and is clumsy
      var strValue = "";
      var paramsRaw = operation.target.properties;
      var params = {}
      for(key in paramsRaw)
      {
        var value = paramsRaw[key][2];
        params[key] = value;
      }
      //var params = operation.value
      if( Object.keys(params).length !== 0 )
      {
        var strValue = JSON.stringify(params);
        strValue.replace(/\\"/g,"\uFFFF"); //U+ FFFF
        strValue = strValue.replace(/\"([^"]+)\":/g,"$1:").replace(/\uFFFF/g,"\\\"");
      }
      
      code += "\nvar "+targetName+" = new "+ type +"("+strValue+")"+lineCap;
      var parentName = "assembly";
      code += parentName+".add( "+ targetName +" )"+lineCap+"\n";
    break;
    case "deletion":
      //TODO: how to deal with this ?
    break;
    case "clone":
      var sourceName = getOperationFormatedItemName(operation, "source");
      code += "var " + targetName+"= "+sourceName+".clone()"+lineCap;
    break;
    case "extrusion":
      var type = target.constructor.name || "foo";
      var sourceShapeName = getOperationFormatedItemName( operation, "sourceShape"  );
      var strValue = JSON.stringify(operation.value);
      strValue.replace(/\\"/g,"\uFFFF"); //U+ FFFF
      strValue = strValue.replace(/\"([^"]+)\":/g,"$1:").replace(/\uFFFF/g,"\\\"");
      code += "var "+targetName+" = "+ sourceShapeName +".extrude("+strValue+")"+lineCap+"\n";
    break;
    
    case "rotation":
      if (!("code" in target)){ target.code = ""};
      code += targetName+".rotate("+ value.x.toFixed(precision)+","+value.y.toFixed(precision)+","+value.z.toFixed(precision)+")"+lineCap;
    break;
    case "translation":
      if (!("code" in target)){ target.code = ""};
      if(target.name == "Shape2dPointHelper")
      {
        console.log("we moved a shape2d helper",target.standInFor,target.sourceParent);
        var sourceParentName =getOperationFormatedItemName( operation, "sourceParent"  );
        var id = target.standInFor.index;
        code += sourceParentName+".controlPoints["+ id +"].translate("+ value.x.toFixed(precision)+","+value.y.toFixed(precision)+",)"+lineCap;
      }
      else if(target.sourceShape)
      {
          var sourceShapeName = target.sourceShape.name.toLowerCase()+target.sourceShape.id;
          code += sourceShapeName+".translate("+ value.x.toFixed(precision)+","+value.y.toFixed(precision)+","+value.z.toFixed(precision)+")"+lineCap;
      }
      else
      {
      code += targetName+".translate("+ value.x.toFixed(precision)+","+value.y.toFixed(precision)+","+value.z.toFixed(precision)+")"+lineCap;
      }
    break;
    case "scaling":
      if (!("code" in target)){ target.code = ""};
      code += targetName+".scale("+ value.x.toFixed(precision)+","+value.y.toFixed(precision)+","+value.z.toFixed(precision)+")"+lineCap;
    break;
    
    case "union":
      var resultName = getOperationFormatedItemName(operation, "result")
      var leftOpName = getOperationFormatedItemName(operation, "target")
      var ops =[];
      for(var i=0;i<operation.operands.length;i++)
      {
        var op = operation.operands[i];
        var opName = getOperationFormatedItemName(op);
        ops.push( opName );
      }
      code += "var " + resultName + "=" + targetName+".union(["+ops.join(",")+"])"+lineCap;
    break;
    case "subtraction":
      var resultName = getOperationFormatedItemName(operation, "result")
      var leftOpName = getOperationFormatedItemName(operation, "target")
      var ops =[];
      for(var i=0;i<operation.operands.length;i++)
      {
        var op = operation.operands[i];
        var opName = getOperationFormatedItemName(op);
        ops.push( opName );
      }
      code += "var " + resultName + "=" + targetName+".subtract(["+ops.join(",")+"])"+lineCap;
    break;
    case "intersection":
      var resultName = getOperationFormatedItemName(operation, "result")
      var leftOpName = getOperationFormatedItemName(operation, "target")
      var ops =[];
      for(var i=0;i<operation.operands.length;i++)
      {
        var op = operation.operands[i];
        var opName = getOperationFormatedItemName(op);
        ops.push( opName );
      }
      code += "var " + resultName + "=" +  targetName+".intersect(["+ops.join(",")+"])"+lineCap;
    break;
  }
  return code;
}

function generateCodeFromOperations(operations)
{
  var code = "";
  for(var i = 0; i< operations.length;i++)
  {
    var operation = operations[i];
      code+=generateCodeFromOperation(operation);
  }
  //console.log("code:\n", code);
  return code;
}

if(typeof module === "Object")
{
  module.exports.generateCodeFromOperations =generateCodeFromOperations;
  module.exports.generateCodeFromOperation = generateCodeFromOperation;
  module.exports.collapseOperations = collapseOperations;
}
