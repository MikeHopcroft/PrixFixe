interface PassFail {
    passed: number;
    failed: number;
}

export class PassFailRates {
    private readonly suiteToPassFail = new Map<string, PassFail>();
    private readonly overall = { passed: 0, failed: 0 };

    record(suite: string, passed: boolean) {
        let pf = this.suiteToPassFail.get(suite);
        if (!pf) {
            pf = { passed: 0, failed: 0 };
            this.suiteToPassFail.set(suite, pf);
        }

        if (passed) {
            pf.passed++;
            this.overall.passed++;
        } else {
            pf.failed++;
            this.overall.failed++;
        }
    }

    format(): string[] {
        const lines: string[] = [];

        const suites = [...this.suiteToPassFail.keys()].sort();
        for (const suite of suites) {
            const { passed, failed } = this.suiteToPassFail.get(suite)!;
            lines.push(`${suite}: ${passed}/${passed + failed}`);
        }
        lines.push('');
        const { passed, failed } = this.overall;
        const rate = (passed / (passed + failed)).toFixed(3);
        lines.push(`Overall: ${passed}/${passed + failed} (${rate})`);

        return lines;
    }
}
