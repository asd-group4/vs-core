grammar VsCore
hidden(WS, SL_COMMENT, ML_COMMENT)


EcoreModel: // wtf 
    name=EcoreModelDefinition
    nsUri?=NsUriDeclaration?
    (ecoreClasses+=EcoreClass | ecoreDefinitions+=EcoreDefinition | ecoreEnums+=EcoreEnum)*;

EcoreModelDefinition:
    'Model' name=ID ';';

NsUriDeclaration: // todo: move from name=STRING to name=UID -> need to fix UID
    'nsUri' name=STRING ';';

EcoreEnum:
    'enum' name=ID OPENBRACKET 
    (enumEntry += EcoreEnumEntry)* CLOSEBRACKET;

EcoreEnumEntry:
    name=ID '<' (
        stringDefinition=STRING ',' numberDefinition=INT | 
        amgiousDefintion=(STRING | INT) // todo: check if this can be split in two cases without becomming ambiguous
        ) '>' ';' ;

EcoreClass:
    (class='class'| interface='interface')
    name=ID
    ('extends' parentClass=[EcoreClass])?
    ('implements' (interfaces+=EcoreClass)*)
    OPENBRACKET
        (features+=EcoreFeature | references+=EcoreReference)*
    CLOSEBRACKET;

EcoreFeature: // todo: find a way for this to be a reference -> so that we can validate that the input is an existing class 
    required?='required'? name=ID (boundDefinnition=BoundDefinition?) featureName=ID ';';

BoundDefinition:
    ARRAY_START (lowerBound=INT ',' upperBound=INT | upperBound=INT)? ARRAY_END;

EcoreReference:
    required?='required'? containmentType=('Container' | 'Containment') ClassCrossReference (boundDefinnition=BoundDefinition?)
    name=ID ';';

EcoreDefinition: // to be able to declare module and ecore url -> IN DUE TIME MAY I ADD BTW 
    name=ID properties=ID ';';

ClassCrossReference:
    '<' classReference=[EcoreClass] boundDefinition=BoundDefinition? '>';


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
