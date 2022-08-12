using System;

namespace IACDemo {
    public class FunctionHandler {
        public Object Invoke() {
            return new { 
                waitSeconds= "5", // Actual input to state machine
                trade=new { tradeId=100 }
            };
        }
    }   
}