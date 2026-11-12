package vn.aeoc.business.recommend.eval.algo;

import vn.aeoc.business.recommend.eval.split.EvalCase;

import java.util.List;

public interface EvalAlgorithm {

    String code();

    List<Integer> rank(EvalCase c, int k);
}
