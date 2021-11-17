grammar VsCore
hidden(WS, SL_COMMENT, ML_COMMENT)

Model:
    (persons+=Person | greetings+=Greeting)*;


EcoreModel: // wtf 
    (classes+=Class | interfaces+=Interface)*;

EcoreFeature: // WTFF
    dataType=ID featureName=ID;

Interface:
    INTERFACE_DECLARATION className=ID;

Class:
    CLASS_DECLARATION className=ID;

Person:
    'person' name=ID;

Greeting:
    'Hello' person=[Person|ID] '!';

terminal INTERFACE_DECLARATION : /interface/;
terminal CLASS_DECLARATION : /class/;

terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;


terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
terminal SL_COMMENT: /\/\/[^\n\r]*/;
