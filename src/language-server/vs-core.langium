grammar VsCore
hidden(WS, SL_COMMENT, ML_COMMENT)


EcoreModel: // wtf 
    name=EcoreModelDefinition
    nsUri=NsUriDeclaration?
    (ecoreClasses+=EcoreClass | ecoreDefinitions+=EcoreDefinition | ecoreEnums+=EcoreEnum)*;

EcoreModelDefinition:
    'Model' name=ID ';';

NsUriDeclaration: // todo: move from name=STRING to name=UID -> need to fix UID
    'nsUri' name=STRING ';';

EcoreEnum:
    'enum' name=ID
    instanceTypeName=InstanceTypeName?
    OPENBRACKET 
        (enumEntry += EcoreEnumEntry ',')*
        enumEntry += EcoreEnumEntry
    CLOSEBRACKET;

EcoreEnumEntry:
    name=ID;

EcoreClass:
    (class?='class'| interface?='interface')
    name=ID
    ('extends' parentClass=[EcoreClass])?
    ('implements' interfaces+=[EcoreClass] (','interfaces+=[EcoreClass])*)?
    instanceTypeName=InstanceTypeName?
    OPENBRACKET
        (features+=EcoreFeature | references+=EcoreReference)*
    CLOSEBRACKET;

EcoreFeature: // todo: find a way for this to be a reference -> so that we can validate that the input is an existing class 
    required?='required'? final?='final'? volatile?='volatile'? transient?='transient'? name=ID (boundDefinition=BoundDefinition?) featureName=ID ';';

BoundDefinition:
    ARRAY_START (lowerBound=INT ',' upperBound=INT | upperBound=INT)? ARRAY_END;

InstanceTypeName: 
    'instanceTypeName' name=STRING;

EcoreReference:
    required?='required'? final?='final'? (containmentType=('Container' | 'Containment') 
    references=ClassCrossReference | refers?='refers' references=ClassReference) (boundDefinition=BoundDefinition?)
    featureName=ID (opposite=Opposite?) ';';

EcoreDefinition: // to be able to declare module and ecore url -> IN DUE TIME MAY I ADD BTW 
    name=ID properties=ID ';';

ClassCrossReference:
    '<' classReference=[EcoreClass] boundDefinition=BoundDefinition? '>';

ClassReference:
    classReference=[EcoreClass] BoundDefinition=BoundDefinition?;

Opposite: 
    'opposite' oppositeClass=[EcoreClass]?; 

//terminal WORD_PERIOD_CONNECTED : /([^\s]+)/;


terminal ARRAY_START : /\[/;
terminal ARRAY_END : /\]/;

terminal OPENBRACKET: /{/;
terminal CLOSEBRACKET: /}/;

terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal UID : /([a-zA-z]\.)[a-zA-Z][\w_]*/;
//terminal UID: /\?(.*)/; // same function as ID, but acceps period 

terminal INT returns number: /-?[0-9]+/; // allows negative and positive numbers -> should prob only allow for any 
// positive number or -1  
terminal STRING: /"[^"]*"|'[^']*'/;


terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
terminal SL_COMMENT: /\/\/[^\n\r]*/;
