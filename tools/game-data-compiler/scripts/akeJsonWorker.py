"""Run AKE's native JSON worker without unwinding an initialized IL2CPP thread.

AKE owns decoding, routing and result validation. The process must exit while
its native thread and callback references still exist, before thread teardown.
"""
import json
import os
from pathlib import Path
import sys
import threading
import traceback


def terminate(code: int) -> None:
    # Only this isolated worker owns the native runtime. Skip Windows DLL detach
    # callbacks as well as Python finalizers; the parent verifies the exit code.
    if os.name == 'nt':
        import ctypes
        kernel = ctypes.WinDLL('kernel32', use_last_error=True)
        kernel.GetCurrentProcess.restype = ctypes.c_void_p
        kernel.TerminateProcess.argtypes = (ctypes.c_void_p, ctypes.c_uint)
        kernel.TerminateProcess(kernel.GetCurrentProcess(), code)
    os._exit(code)


def main() -> None:
    sys.path.insert(0, str(Path(sys.argv[1]).resolve()))
    from ake_tool.json_host import export_json

    # AKE routes many datasets used by other tools. Only decode the collections
    # and individual files requested by the compiler's source catalog.
    catalog = json.loads((Path(__file__).resolve().parents[1] / 'game-data-sources.json').read_text('utf-8'))
    collections = tuple(f'data/json/{name.casefold()}/' for name in catalog['jsonCollections'])
    files = {f'data/json/{name.casefold()}' for name in catalog['jsonFiles']}
    select_entries = export_json.select_entries

    def select_compiler_entries(vfs, datasets, limit):
        return [
            (entry, schema) for entry, schema in select_entries(vfs, datasets, limit)
            if entry.name.casefold() in files or entry.name.casefold().startswith(collections)
        ]

    export_json.select_entries = select_compiler_entries

    def run_worker(args):
        def execute():
            code = 1
            try:
                code = export_json.worker(args)
            except BaseException:
                traceback.print_exc()
            finally:
                sys.stdout.flush()
                sys.stderr.flush()
                terminate(code)

        threading.stack_size(16 * 1024 * 1024)
        thread = threading.Thread(target=execute, name='il2cpp-host')
        thread.start()
        thread.join()
        raise RuntimeError('Native worker returned without terminating its process')

    export_json.run_worker_with_stack = run_worker
    code = export_json.main(sys.argv[2:])
    sys.stdout.flush()
    sys.stderr.flush()
    terminate(code)


if __name__ == '__main__':
    main()
