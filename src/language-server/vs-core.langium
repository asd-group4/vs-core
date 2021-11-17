grammar VsCore
hidden(WS, SL_COMMENT, ML_COMMENT)

//EcoreModel: // wtf 
//    (classes+=Class | interfaces+=Interface)*;

EcoreFeature: // WTFF
    dataType=ID featureName=WS;

EcoreRefference:
    containmentType=ID'<'class=[Class]'>'
    referenceName=WS;

Interface:
    INTERFACE_DECLARATION interfaceName=ID OPENBRACKET
    (features+=EcoreFeature | references+=EcoreRefference)*
    CLOSEBRACKET;

Class:
    CLASS_DECLARATION className=ID OPENBRACKET 
    (features+=EcoreFeature | references+=EcoreRefference)*
    CLOSEBRACKET;

terminal INTERFACE_DECLARATION : /interface/;
terminal CLASS_DECLARATION : /class/;

terminal NEWLINE: /[\n\r]+/;

terminal OPENBRACKET: /{/;
terminal CLOSEBRACKET: /}/;

terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;


terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
terminal SL_COMMENT: /\/\/[^\n\r]*/;
