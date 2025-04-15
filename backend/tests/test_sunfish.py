# test_engine_subprocess.py

import unittest
import subprocess
import sys
import os
import time

class TestYanfishSubprocess(unittest.TestCase):
    def test_run_engine_subprocess(self):
        """
        Spawns a child process running yanfish.py,
        sends it moves via stdin, and checks the output.
        """

        engine_path = os.path.join(os.path.dirname(__file__), "..", "engines", "yanfish.py")
        # or "yanfish.py" if in the same folder; adjust as needed.

        # Start the engine in a subprocess
        p = subprocess.Popen(
            [sys.executable, "-u", engine_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )

        # Provide some moves or commands
        commands = [
            "e2e4\n",
            "e7e5\n",
            # Possibly more moves or commands
            "quit\n"
        ]

        # Send commands
        for cmd in commands:
            p.stdin.write(cmd)
            p.stdin.flush()
            time.sleep(0.1)  # Give it a moment to process

        # Read some lines of output
        output_lines = []
        try:
            for _ in range(20):  # read up to 20 lines
                line = p.stdout.readline()
                if not line:
                    break
                output_lines.append(line.strip())
        finally:
            p.terminate()
            p.wait()

        # Now we can run assertions
        full_output = "\n".join(output_lines)
        self.assertIn("Your move:", full_output,
                      "Expected the engine to prompt for a move in its output")

if __name__ == "__main__":
    unittest.main()
