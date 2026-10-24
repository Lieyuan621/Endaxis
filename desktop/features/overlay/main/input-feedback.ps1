$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;
public static class EndaxisInput {
  [DllImport("user32.dll")] static extern short GetAsyncKeyState(int key);
  [StructLayout(LayoutKind.Sequential)] struct Pad { public uint packet; public ushort buttons; public byte lt, rt; public short lx, ly, rx, ry; }
  [DllImport("xinput1_4.dll")] static extern uint XInputGetState(uint index, out Pad state);
  public static void Run() {
    int[] keys = {49,50,51,52,69,112,113,114,115,1};
    string previous = "";
    var watch = Stopwatch.StartNew(); long epoch = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    Console.WriteLine("ready");
    while(true) {
      int keyboard = 0; uint padIndex = 4; ushort buttons = 0;
      {
        for(int i=0;i<keys.Length;i++) if((GetAsyncKeyState(keys[i]) & 0x8000)!=0) keyboard |= 1<<i;
        for(uint i=0;i<4;i++) { Pad pad; if(XInputGetState(i,out pad)==0) { padIndex=i; buttons=pad.buttons; break; } }
      }
      string sample = keyboard.ToString()+","+padIndex+","+buttons;
      if(sample != previous) { Console.WriteLine((epoch+watch.ElapsedMilliseconds)+","+sample); previous=sample; }
      Thread.Sleep(8);
    }
  }
}
"@
[EndaxisInput]::Run()
