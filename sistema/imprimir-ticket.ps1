param(
    [Parameter(Mandatory = $true)]
    [string]$TicketBase64
)

$ticketJson = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($TicketBase64))
$ticket = $ticketJson | ConvertFrom-Json

Add-Type -AssemblyName System.Drawing
$comprobacion = New-Object System.Drawing.Printing.PrintDocument
$comprobacion.PrinterSettings.PrinterName = $ticket.printerName
if (-not $comprobacion.PrinterSettings.IsValid) {
    throw "Windows no encuentra la impresora '$($ticket.printerName)'."
}
$comprobacion.Dispose()

if (-not ("RawPrinter" -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class RawPrinter {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.drv", CharSet = CharSet.Ansi, SetLastError = true)]
    public static extern bool OpenPrinter(string name, out IntPtr handle, IntPtr defaults);
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool ClosePrinter(IntPtr handle);
    [DllImport("winspool.drv", CharSet = CharSet.Ansi, SetLastError = true)]
    public static extern int StartDocPrinter(IntPtr handle, int level, [In] DOCINFOA docInfo);
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool EndDocPrinter(IntPtr handle);
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool StartPagePrinter(IntPtr handle);
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool EndPagePrinter(IntPtr handle);
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool WritePrinter(IntPtr handle, byte[] bytes, int count, out int written);

    public static void Send(string printerName, byte[] bytes) {
        IntPtr handle;
        if (!OpenPrinter(printerName, out handle, IntPtr.Zero)) throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
        try {
            var document = new DOCINFOA { pDocName = "Ticket", pDataType = "RAW" };
            if (StartDocPrinter(handle, 1, document) == 0) throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
            try {
                if (!StartPagePrinter(handle)) throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
                try {
                    int written;
                    if (!WritePrinter(handle, bytes, bytes.Length, out written) || written != bytes.Length) throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
                } finally { EndPagePrinter(handle); }
            } finally { EndDocPrinter(handle); }
        } finally { ClosePrinter(handle); }
    }
}
'@
}

$codificacion = [Text.Encoding]::GetEncoding(850)
$bytes = [System.Collections.Generic.List[byte]]::new()

# Inicializa la impresora y usa tamaño doble en todo el ticket.
$bytes.AddRange([byte[]](0x1B, 0x40))
$bytes.AddRange([byte[]](0x1D, 0x21, 0x11)) # Doble alto y ancho
$avanceInicialSolicitado = if ($null -eq $ticket.lineasAvanceInicio) { 0 } else { $ticket.lineasAvanceInicio }
$lineasAvanceInicio = [Math]::Max(0, [Math]::Min(255, [int]$avanceInicialSolicitado))
if ($lineasAvanceInicio -gt 0) {
    $bytes.AddRange([byte[]](0x1B, 0x64, $lineasAvanceInicio))
}
foreach ($linea in $ticket.lines) {
    if ($linea -like "*CORTAR*") {
        # La guía de corte se imprime pequeña, aunque el ticket use tamaño doble.
        $bytes.AddRange([byte[]](0x1D, 0x21, 0x00))
        $bytes.AddRange([byte[]](0x1B, 0x61, 0x01))
        $bytes.AddRange($codificacion.GetBytes($linea + "`n"))
        $bytes.AddRange([byte[]](0x1B, 0x61, 0x00))
        $bytes.AddRange([byte[]](0x1D, 0x21, 0x11))
    } elseif ($linea -eq "PAGO CON TARJETA") {
        # Resalta y centra la forma de pago en la orden de preparación.
        $bytes.AddRange([byte[]](0x1B, 0x61, 0x01))
        $bytes.AddRange([byte[]](0x1B, 0x45, 0x01))
        $bytes.AddRange($codificacion.GetBytes($linea + "`n"))
        $bytes.AddRange([byte[]](0x1B, 0x45, 0x00))
        $bytes.AddRange([byte[]](0x1B, 0x61, 0x00))
    } elseif ($linea -like "ORDEN #*" -or $linea -like "SODAS #*" -or $linea -like "TOTAL*" -or $linea -like "SODAS*") {
        $bytes.AddRange([byte[]](0x1B, 0x61, 0x01)) # Centrar
        $bytes.AddRange($codificacion.GetBytes($linea + "`n"))
        $bytes.AddRange([byte[]](0x1B, 0x61, 0x00)) # Alinear a la izquierda
    } else {
        $bytes.AddRange($codificacion.GetBytes($linea + "`n"))
    }
}

$avanceSolicitado = if ($null -eq $ticket.lineasAvance) { 5 } else { $ticket.lineasAvance }
$lineasAvance = [Math]::Max(0, [Math]::Min(255, [int]$avanceSolicitado))
$bytes.AddRange([byte[]](0x1B, 0x64, $lineasAvance)) # Avanzar papel al terminar
[RawPrinter]::Send($ticket.printerName, $bytes.ToArray())
