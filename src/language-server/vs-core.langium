grammar VsCore
hidden(WS, SL_COMMENT, ML_COMMENT)


EcoreModel: // wtf 
    (classes+=EcoreClass | definitions+=EcoreDefinition | enums+=EcoreEnum)*;

EcoreEnum:
    'enum' name=ID OPENBRACKET
    (enumEntry += EcoreEnumEntry)* CLOSEBRACKET;

EcoreEnumEntry:
    name=ID '<' (
        stringDefinition?=STRING? ',' numberDefinition?=INT? | 
        amgiousDefintion?=(STRING | INT)
        ) '>' ';' ;

EcoreClass:
    (class='class'| interface='interface') name=ID ('extends' parentClass=[EcoreClass])? OPENBRACKET 
    (features+=EcoreFeature | references+=EcoreReference)*
    CLOSEBRACKET;

EcoreFeature: // todo: find a way for this to be a reference -> so that we can validate that the input is an existing class 
    required?='required'? dataType=ID boundDefinnition?=BoundDefinition? featureName=ID ';';

BoundDefinition:
    ARRAY_START (startPoint?=INT? ',' endPoint?=INT? | endPoint?=INT?) ARRAY_END;

EcoreReference:
    containmentType=('Container' | 'Containment') ClassCrossReference
    referenceName=ID ';';

EcoreDefinition: // to be able to declare module and ecore url -> IN DUE TIME MAY I ADD BTW 
    definitionType=(MODULE_DECLARATION | NS_URI_DECLARATION) properties=ID;

ClassCrossReference:
    '<' classReference=[EcoreClass] boundDefinition?=BoundDefinition? '>';


terminal MODULE_DECLARATION : /'module'/;
terminal NS_URI_DECLARATION : /'nsURI'/;

terminal ARRAY_START : /\[/;
terminal ARRAY_END : /\]/;


terminal OPENBRACKET: /{/;
terminal CLOSEBRACKET: /}/;


terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /-?[0-9]+/; // allows negative and positive numbers -> should prob only allow for any 
// positive number or -1  
terminal STRING: /"[^"]*"|'[^']*'/;


terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
terminal SL_COMMENT: /\/\/[^\n\r]*/;
